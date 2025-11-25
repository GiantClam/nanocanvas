
import React, { useEffect, useRef, useState } from 'react';
import Toolbar from './components/Toolbar';
import AIPanel from './components/AIPanel';
import ContextMenu from './components/ContextMenu';
import PromptPopup from './components/PromptPopup';
import { ModelType, ContextMenuState, SelectedProperties, AIData } from './types';
import { generateContent, generateVideoContent } from './services/geminiService';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderLoopId = useRef<number | null>(null);
  
  const [activeTool, setActiveTool] = useState('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, hasSelection: false });
  const [promptPopup, setPromptPopup] = useState<{ visible: boolean; x: number; y: number; prompt: string }>({ visible: false, x: 0, y: 0, prompt: '' });

  // Style State - Defaults updated for White Background
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperties>({
    stroke: '#000000',
    strokeWidth: 3,
    fill: '#000000',
    fontSize: 32,
    type: ''
  });

  // Helper to map hex colors to approximate names for prompt
  const getColorName = (hex: string): string => {
    const colors: {[key: string]: string} = {
      '#ffffff': 'white', '#000000': 'black', '#ef4444': 'red', '#f97316': 'orange',
      '#eab308': 'yellow', '#22c55e': 'green', '#3b82f6': 'blue', '#6366f1': 'indigo',
      '#a855f7': 'purple', '#ec4899': 'pink'
    };
    return colors[hex.toLowerCase()] || 'colored';
  };

  // --- RENDER LOOP FOR VIDEOS ---
  const startRenderLoop = () => {
    if (renderLoopId.current) return;
    const loop = () => {
      if (fabricRef.current) {
        fabricRef.current.requestRenderAll();
      }
      renderLoopId.current = window.requestAnimationFrame(loop);
    };
    renderLoopId.current = window.requestAnimationFrame(loop);
  };
  // ------------------------------

  // Initialize Fabric
  useEffect(() => {
    // Listen for custom event to open prompt popup from Fabric control
    const handleOpenPromptPopup = (e: CustomEvent) => {
      setPromptPopup({
        visible: true,
        x: e.detail.x,
        y: e.detail.y,
        prompt: e.detail.prompt
      });
    };
    window.addEventListener('openPromptPopup', handleOpenPromptPopup as EventListener);

    if (canvasRef.current && containerRef.current && !fabricRef.current) {
      const fabric = window.fabric;
      if (!fabric) return;

      // Customize Selection Styles
      fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#6366f1',
        borderColor: '#6366f1',
        cornerSize: 10,
        padding: 5,
        cornerStyle: 'circle',
        borderDashArray: [4, 4]
      });

      // --- CUSTOM CONTROL: AI Info Icon (...) ---
      // This control appears on the top-right of AI-generated images
      fabric.Object.prototype.controls.aiInfo = new fabric.Control({
        x: 0.5,
        y: -0.5,
        offsetX: 15,
        offsetY: -15,
        cursorStyle: 'pointer',
        mouseUpHandler: function(eventData: MouseEvent, transform: any, x: number, y: number) {
          const target = transform.target;
          if (target && target.aiData) {
            window.dispatchEvent(new CustomEvent('openPromptPopup', { 
              detail: { x: eventData.clientX, y: eventData.clientY, prompt: target.aiData.prompt } 
            }));
            return true;
          }
          return false;
        },
        render: function(ctx: CanvasRenderingContext2D, left: number, top: number, styleOverride: any, fabricObject: any) {
          // Only render if aiData exists
          if (!fabricObject.aiData) return;

          const size = 16;
          ctx.save();
          ctx.translate(left, top);
          
          // Background Circle
          ctx.beginPath();
          ctx.arc(0, 0, size/2 + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1'; // Indigo
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Dots (...)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      });
      // ------------------------------------------

      const initFabric = () => {
         const canvas = new fabric.Canvas(canvasRef.current, {
          width: containerRef.current?.clientWidth || window.innerWidth,
          height: containerRef.current?.clientHeight || window.innerHeight,
          backgroundColor: '#ffffff', // White background
          selection: true,
          preserveObjectStacking: true,
          fireRightClick: true,
          stopContextMenu: true
        });

        // --- Grid Pattern Implementation ---
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const ctx = patternCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#cbd5e1'; // Light slate dot
          ctx.beginPath();
          ctx.arc(10, 10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const gridPattern = new fabric.Pattern({
          source: patternCanvas,
          repeat: 'repeat'
        });
        
        canvas.setBackgroundColor(gridPattern, canvas.renderAll.bind(canvas));
        // -----------------------------------

        fabricRef.current = canvas;

        // --- Interaction Logic Vars ---
        let isDragging = false;
        let isDrawingShape = false;
        let shapeOriginX = 0;
        let shapeOriginY = 0;
        let activeShape: any = null;
        let lastPosX = 0;
        let lastPosY = 0;

        // Snapping Logic
        canvas.on('object:moving', (e: any) => {
          const target = e.target;
          if (!target) return;
          const snapDist = 15; 
          const gridSize = 50; 
          let newLeft = target.left;
          let newTop = target.top;
          
          if (Math.abs(newLeft % gridSize) < snapDist) newLeft = Math.round(newLeft / gridSize) * gridSize;
          if (Math.abs(newTop % gridSize) < snapDist) newTop = Math.round(newTop / gridSize) * gridSize;
          
          canvas.forEachObject((obj: any) => {
             if (obj === target || !obj.visible) return; 
             const tWidth = target.width * target.scaleX;
             const tHeight = target.height * target.scaleY;
             const oWidth = obj.width * obj.scaleX;
             const oHeight = obj.height * obj.scaleY;

             if (Math.abs(newLeft - obj.left) < snapDist) newLeft = obj.left;
             if (Math.abs(newTop - obj.top) < snapDist) newTop = obj.top;
             if (Math.abs((newLeft + tWidth) - (obj.left + oWidth)) < snapDist) newLeft = obj.left + oWidth - tWidth;
             if (Math.abs((newTop + tHeight) - (obj.top + oHeight)) < snapDist) newTop = obj.top + oHeight - tHeight;
          });
          target.set({ left: newLeft, top: newTop });
        });

        // Mouse Down
        canvas.on('mouse:down', function(opt: any) {
          const evt = opt.e;
          
          // Right Click
          if (opt.button === 3 || opt.e.button === 2) {
             const activeObj = canvas.getActiveObject();
             if (opt.target && opt.target !== activeObj) {
                canvas.setActiveObject(opt.target);
             }
             setContextMenu({
               visible: true,
               x: evt.clientX,
               y: evt.clientY,
               hasSelection: !!canvas.getActiveObject()
             });
             return;
          }
          setContextMenu(prev => ({ ...prev, visible: false }));
          setPromptPopup(prev => ({ ...prev, visible: false })); // Close prompt popup on click

          // Alt+Drag Panning
          if (evt.altKey === true) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            return;
          }

          // Shape Drawing
          const pointer = canvas.getPointer(evt);
          const tool = (canvas as any).customTool; 
          const props = (canvas as any).customProps || {};

          if (tool === 'rect' || tool === 'circle') {
             isDrawingShape = true;
             shapeOriginX = pointer.x;
             shapeOriginY = pointer.y;

             if (tool === 'rect') {
                activeShape = new fabric.Rect({
                   left: shapeOriginX,
                   top: shapeOriginY,
                   originX: 'left',
                   originY: 'top',
                   width: 0,
                   height: 0,
                   stroke: props.stroke || '#000000',
                   strokeWidth: props.strokeWidth || 3,
                   fill: 'transparent',
                   transparentCorners: false
                });
             } else if (tool === 'circle') {
                activeShape = new fabric.Circle({
                   left: shapeOriginX,
                   top: shapeOriginY,
                   originX: 'left',
                   originY: 'top',
                   radius: 0,
                   stroke: props.stroke || '#000000',
                   strokeWidth: props.strokeWidth || 3,
                   fill: 'transparent',
                   transparentCorners: false
                });
             }
             canvas.add(activeShape);
             canvas.selection = false; // Disable group selection while drawing
          } else if (tool === 'text') {
             // Click to add text
             const text = new fabric.IText('Type Here', {
               left: pointer.x,
               top: pointer.y,
               fontFamily: 'Inter',
               fill: props.fill || '#000000',
               fontSize: props.fontSize || 32,
             });
             canvas.add(text);
             canvas.setActiveObject(text);
             setActiveTool('select'); // Switch back immediately
          }
        });

        // Mouse Move
        canvas.on('mouse:move', function(opt: any) {
          if (isDragging) {
            const e = opt.e;
            const vpt = canvas.viewportTransform;
            vpt[4] += e.clientX - lastPosX;
            vpt[5] += e.clientY - lastPosY;
            canvas.requestRenderAll();
            lastPosX = e.clientX;
            lastPosY = e.clientY;
            return;
          }

          if (isDrawingShape && activeShape) {
             const pointer = canvas.getPointer(opt.e);
             if (activeShape.type === 'rect') {
                const w = Math.abs(pointer.x - shapeOriginX);
                const h = Math.abs(pointer.y - shapeOriginY);
                activeShape.set({ width: w, height: h });
                
                if (shapeOriginX > pointer.x) activeShape.set({ left: pointer.x });
                if (shapeOriginY > pointer.y) activeShape.set({ top: pointer.y });

             } else if (activeShape.type === 'circle') {
                const radius = Math.abs(pointer.x - shapeOriginX) / 2;
                activeShape.set({ radius: radius });
                if (shapeOriginX > pointer.x) activeShape.set({ left: pointer.x });
                if (shapeOriginY > pointer.y) activeShape.set({ top: pointer.y });
             }
             canvas.renderAll();
          }
        });

        // Mouse Up
        canvas.on('mouse:up', function(opt: any) {
          canvas.setViewportTransform(canvas.viewportTransform);
          isDragging = false;
          
          if (isDrawingShape) {
             isDrawingShape = false;
             if (activeShape) {
                activeShape.setCoords();
                // If created shape is tiny, remove it (accidental click)
                if ((activeShape.width || 0) < 5 && (activeShape.radius || 0) < 5) {
                   canvas.remove(activeShape);
                } else {
                   canvas.setActiveObject(activeShape);
                   setHasSelection(true);
                }
             }
             activeShape = null;
             canvas.selection = true;
             setActiveTool('select'); // Auto switch back to select
          }
        });

        // Selection Events & Property Sync
        const updateSelectionState = () => {
          const activeObj = canvas.getActiveObject();
          setHasSelection(!!activeObj);
          
          if (activeObj) {
            const type = activeObj.type;
            const isText = type === 'i-text' || type === 'text';
            
            if (activeObj.type !== 'activeSelection') {
               setSelectedProperties(prev => ({
                 ...prev,
                 stroke: activeObj.stroke || prev.stroke,
                 strokeWidth: activeObj.strokeWidth || prev.strokeWidth,
                 fill: isText ? (activeObj.fill as string) : prev.fill,
                 fontSize: (activeObj as any).fontSize || prev.fontSize,
                 type: activeObj.type || ''
               }));
            } else {
               setSelectedProperties(prev => ({ ...prev, type: 'group' }));
            }
          } else {
             setSelectedProperties(prev => ({ ...prev, type: '' }));
          }
        };

        canvas.on('selection:created', updateSelectionState);
        canvas.on('selection:updated', updateSelectionState);
        canvas.on('selection:cleared', updateSelectionState);

        // Zoom
        canvas.on('mouse:wheel', function(opt: any) {
          const delta = opt.e.deltaY;
          let zoom = canvas.getZoom();
          zoom *= 0.999 ** delta;
          if (zoom > 20) zoom = 20;
          if (zoom < 0.01) zoom = 0.01;
          canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
          opt.e.preventDefault();
          opt.e.stopPropagation();
          setContextMenu(prev => ({ ...prev, visible: false }));
        });
      };

      initFabric();
      
      // Start global render loop for potential video elements
      startRenderLoop();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            handleDeleteSelection();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      
      const handleResize = () => {
        if (fabricRef.current && containerRef.current) {
          fabricRef.current.setWidth(containerRef.current.clientWidth);
          fabricRef.current.setHeight(containerRef.current.clientHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('openPromptPopup', handleOpenPromptPopup as EventListener);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('keydown', handleKeyDown);
        if (renderLoopId.current) cancelAnimationFrame(renderLoopId.current);
        if (fabricRef.current) {
          fabricRef.current.dispose();
          fabricRef.current = null;
        }
      };
    }
  }, []);

  // Update Canvas Tool Mode and Properties when React state changes
  useEffect(() => {
     if (fabricRef.current) {
        // Sync tool
        (fabricRef.current as any).customTool = activeTool;
        // Sync properties for new shapes
        (fabricRef.current as any).customProps = selectedProperties;

        // Set cursors
        if (activeTool === 'select') {
           fabricRef.current.defaultCursor = 'default';
           fabricRef.current.isDrawingMode = false;
        } else if (activeTool === 'draw') {
           fabricRef.current.isDrawingMode = true;
           if(fabricRef.current.freeDrawingBrush) {
              fabricRef.current.freeDrawingBrush.color = selectedProperties.stroke;
              fabricRef.current.freeDrawingBrush.width = selectedProperties.strokeWidth;
           }
        } else {
           fabricRef.current.defaultCursor = 'crosshair';
           fabricRef.current.isDrawingMode = false;
           fabricRef.current.discardActiveObject();
           fabricRef.current.requestRenderAll();
        }
     }
  }, [activeTool, selectedProperties]);


  // Handler to update properties from Toolbar
  const handlePropertyChange = (key: keyof SelectedProperties, value: any) => {
    setSelectedProperties(prev => ({ ...prev, [key]: value }));
    
    if (fabricRef.current) {
       const canvas = fabricRef.current;
       const activeObj = canvas.getActiveObject();
       
       // Update active drawing brush if in draw mode
       if (key === 'stroke' && canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = value;
       if (key === 'strokeWidth' && canvas.freeDrawingBrush) canvas.freeDrawingBrush.width = value;

       if (activeObj) {
          if (key === 'stroke') {
             // For shapes/lines
             if (activeObj.type !== 'i-text') activeObj.set('stroke', value);
          } else if (key === 'strokeWidth') {
             if (activeObj.type !== 'i-text') activeObj.set('strokeWidth', value);
          } else if (key === 'fill') {
             // For text
             if (activeObj.type === 'i-text' || activeObj.type === 'text') activeObj.set('fill', value);
          } else if (key === 'fontSize') {
             if (activeObj.type === 'i-text' || activeObj.type === 'text') activeObj.set('fontSize', value);
          }
          canvas.requestRenderAll();
       }
    }
  };

  const handleDeleteSelection = () => {
    if (!fabricRef.current) return;
    const canvas = fabricRef.current;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj: any) => {
        canvas.remove(obj);
      });
      canvas.requestRenderAll();
      setHasSelection(false);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleFlattenSelection = () => {
     if (!fabricRef.current) return;
     const canvas = fabricRef.current;
     const activeObj = canvas.getActiveObject();
     if (!activeObj) return;

     const dataURL = activeObj.toDataURL({ format: 'png', multiplier: 2 });
     const left = activeObj.left;
     const top = activeObj.top;

     canvas.remove(activeObj);
     window.fabric.Image.fromURL(dataURL, (img: any) => {
         img.set({ left: left, top: top, scaleX: 0.5, scaleY: 0.5 });
         canvas.add(img);
         canvas.setActiveObject(img);
         canvas.renderAll();
     });
     setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && fabricRef.current) {
      const reader = new FileReader();
      reader.onload = (f) => {
        const data = f.target?.result;
        window.fabric.Image.fromURL(data, (img: any) => {
          img.scaleToWidth(300);
          fabricRef.current.add(img);
          fabricRef.current.centerObject(img);
          fabricRef.current.setActiveObject(img);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadSelection = () => {
    if (!fabricRef.current) return;
    const activeObj = fabricRef.current.getActiveObject();
    if (!activeObj) return;

    const dataURL = activeObj.toDataURL({ format: 'png', quality: 1, multiplier: 4 });
    const link = document.createElement('a');
    link.download = `nano-selection-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Main Generation Logic ---
  const handleGenerate = async (prompt: string, model: ModelType) => {
    if (!fabricRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = fabricRef.current;
      const activeObj = canvas.getActiveObject();
      
      let imagesPayload: string[] = [];
      let finalPrompt = prompt;
      
      // Target position for result
      let targetX = 0;
      let targetY = 0;
      let visualWidth = 0;
      let refWidth = 0;
      let refHeight = 0;

      // Extract Context (Image or Viewport)
      if (activeObj) {
        // --- Selection Context ---
        const objs = activeObj.type === 'activeSelection' ? activeObj.getObjects() : [activeObj];
        
        // Check content types
        const hasImages = objs.some((o: any) => o.type === 'image');
        const hasShapes = objs.some((o: any) => ['rect', 'circle', 'path', 'line'].includes(o.type));
        
        targetX = activeObj.left + activeObj.getScaledWidth() + 20;
        targetY = activeObj.top;
        visualWidth = activeObj.getScaledWidth();
        refWidth = visualWidth;
        refHeight = activeObj.getScaledHeight();

        const maxDim = Math.max(activeObj.getScaledWidth(), activeObj.getScaledHeight());
        const targetDim = 1536;
        const calculatedMultiplier = maxDim < targetDim ? (targetDim / maxDim) : 1;

        if (hasImages && !hasShapes && objs.length > 1) {
           console.log("Multi-image mode detected");
           imagesPayload = objs
             .filter((o: any) => o.type === 'image')
             .map((o: any) => {
                const iMax = Math.max(o.getScaledWidth(), o.getScaledHeight());
                const iMult = iMax < 1024 ? (1024/iMax) : 1;
                return o.toDataURL({ format: 'png', multiplier: iMult }).split(',')[1];
             });
        } 
        else if (hasImages && hasShapes) {
           console.log("Annotation mode detected.");
           const flatBase64 = activeObj.toDataURL({ format: 'png', multiplier: calculatedMultiplier }).split(',')[1];
           imagesPayload = [flatBase64];

           const instructions: string[] = [];
           objs.forEach((o: any) => {
             if (['rect', 'circle'].includes(o.type)) {
               const colorName = getColorName(o.stroke || o.fill);
               const shapeName = o.type === 'rect' ? 'rectangle' : 'circle';
               instructions.push(`remove the ${colorName} ${shapeName} annotation`);
             }
           });
           
           if (instructions.length > 0) {
             finalPrompt += ` (IMPORTANT: ${instructions.join(', ')} from the final result, but use it as a reference for the edit).`;
           }
        }
        else {
           // Standard Image or Just Shapes
           console.log("Standard mode detected.");
           const flatBase64 = activeObj.toDataURL({ format: 'png', multiplier: calculatedMultiplier }).split(',')[1];
           imagesPayload = [flatBase64];
        }

      } else {
        // --- Viewport Context (Only if NOT VEO IMAGE TO VIDEO) ---
        // Veo requires specific image input for Img2Video, usually specific active object selection is better.
        // But if no selection, we capture viewport.
        
        visualWidth = 400; 
        refWidth = canvas.width;
        refHeight = canvas.height;
        const vpt = canvas.viewportTransform;
        targetX = (-vpt[4] + canvas.width / 2) / vpt[0] - (visualWidth / 2);
        targetY = (-vpt[5] + canvas.height / 2) / vpt[3] - (visualWidth / 2);

        // Only capture viewport if model supports image input or user wants Img2Video without selection
        // For Text2Video (Veo), imagesPayload might be empty if we want pure text generation.
        // However, current logic assumes if prompt + no selection => generate from text.
        // But for `generateContent` (Image Models), we usually send viewport as context if nothing selected.
        if (model !== ModelType.VEO_FAST && model !== ModelType.VEO_HQ) {
            const base64 = canvas.toDataURL({ format: 'png' }).split(',')[1];
            imagesPayload = [base64];
        }
      }

      // --- BRANCH: VIDEO GENERATION ---
      if (model === ModelType.VEO_FAST || model === ModelType.VEO_HQ) {
         const videoUrl = await generateVideoContent({
            prompt: finalPrompt,
            model,
            images: imagesPayload
         });

         // Create Video Element
         const videoEl = document.createElement('video');
         videoEl.src = videoUrl;
         videoEl.crossOrigin = 'anonymous';
         videoEl.loop = true;
         videoEl.muted = true;
         videoEl.width = 1280; // Default Veo resolution width (approx)
         videoEl.height = 720;
         videoEl.play();

         // Create Fabric Image
         const fabricVid = new window.fabric.Image(videoEl, {
            left: targetX,
            top: targetY,
            objectCaching: false,
         });
         
         if (visualWidth > 0) {
            fabricVid.scaleToWidth(visualWidth);
         } else {
            fabricVid.scaleToWidth(400); // Default width
         }

         // Inject AI Data
         fabricVid.set('aiData', {
            prompt: finalPrompt,
            model: model,
            timestamp: Date.now()
         } as AIData);

         canvas.add(fabricVid);
         canvas.setActiveObject(fabricVid);
         canvas.renderAll();
         setHasSelection(true);
         
         return;
      }

      // --- BRANCH: IMAGE GENERATION ---
      const { imageBase64 } = await generateContent({
        prompt: finalPrompt,
        model,
        images: imagesPayload,
        referenceWidth: refWidth,
        referenceHeight: refHeight
      });

      // Place Result
      if (imageBase64) {
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        window.fabric.Image.fromURL(imageUrl, (img: any) => {
          if (visualWidth > 0) {
              img.scaleToWidth(visualWidth);
          }
          img.set({ left: targetX, top: targetY });
          
          // INJECT AI METADATA
          img.set('aiData', {
            prompt: finalPrompt,
            model: model,
            timestamp: Date.now()
          } as AIData);

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          setHasSelection(true);
        });
      }

    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate content. See console for details.");
      throw error; // Re-throw so AIPanel sees the error state
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompose = () => {
    if (hasSelection) handleGenerate("Seamlessly merge these into one cohesive image.", ModelType.NANO_BANANA_1);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleMatting = () => {
     if (hasSelection) handleGenerate("Remove the background.", ModelType.NANO_BANANA_1);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 relative">
      <Toolbar 
        activeTool={activeTool} 
        onSelectTool={setActiveTool} 
        onDelete={handleDeleteSelection}
        onDownload={handleDownloadSelection}
        onUploadImage={handleUploadImage}
        selectedProperties={selectedProperties}
        onUpdateProperty={handlePropertyChange}
        hasSelection={hasSelection}
      />

      <AIPanel 
        onGenerate={handleGenerate} 
        isGenerating={isGenerating} 
        hasSelection={hasSelection}
      />

      <ContextMenu 
        x={contextMenu.x}
        y={contextMenu.y}
        visible={contextMenu.visible}
        onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
        onCompose={handleCompose}
        onMatting={handleMatting}
        onFlatten={handleFlattenSelection}
        onDelete={handleDeleteSelection}
      />

      {/* PROMPT POPUP */}
      <PromptPopup 
        visible={promptPopup.visible}
        x={promptPopup.x}
        y={promptPopup.y}
        prompt={promptPopup.prompt}
        onClose={() => setPromptPopup(prev => ({ ...prev, visible: false }))}
      />

      <div ref={containerRef} className="absolute inset-0 z-0 bg-white">
         <canvas ref={canvasRef} />
         <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/10 backdrop-blur px-6 py-2 rounded-full text-[10px] text-slate-500 pointer-events-none border border-slate-200 select-none">
            Right-click objects for AI actions • Alt+Drag to Pan • Scroll to Zoom
         </div>
      </div>
    </div>
  );
}

export default App;
