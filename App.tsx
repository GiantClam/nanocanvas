
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Toolbar from './components/Toolbar';
import AIPanel from './components/AIPanel';
import ContextMenu from './components/ContextMenu';
import PromptPopup from './components/PromptPopup';
import Workspace from './components/Workspace';
import { ModelType, ContextMenuState, SelectedProperties, AIData, NanoCanvasProps, Project, GalleryItem, Template } from './types';
import { NanoAI, GenerateOptions } from './services/aiService';

// Default Config if none provided (for standalone running)
const DEFAULT_API_KEY = "AIzaSyDEskyGfoYxEqC1QRA4H1vodqjMOFrmCQY";

const App: React.FC<NanoCanvasProps> = ({ config, initialCanvasState, onBillingEvent }) => {
  // Routing State
  const [view, setView] = useState<'workspace' | 'editor'>('workspace');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [initialTemplatePrompt, setInitialTemplatePrompt] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderLoopId = useRef<number | null>(null);
  const aiPanelRef = useRef<any>(null); // To create refs for manual prompt setting if needed, or pass props
  
  // Initialize AI Service
  const aiService = useMemo(() => {
    return new NanoAI(
      config || { provider: 'google', apiKey: DEFAULT_API_KEY },
      onBillingEvent
    );
  }, [config, onBillingEvent]);

  const [activeTool, setActiveTool] = useState('select');
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, hasSelection: false });
  const [promptPopup, setPromptPopup] = useState<{ visible: boolean; x: number; y: number; prompt: string }>({ visible: false, x: 0, y: 0, prompt: '' });

  // Style State
  const [selectedProperties, setSelectedProperties] = useState<SelectedProperties>({
    stroke: '#000000',
    strokeWidth: 3,
    fill: '#000000',
    fontSize: 32,
    type: ''
  });

  // Load Gallery from LocalStorage
  useEffect(() => {
    try {
       const savedGallery = localStorage.getItem('nc_gallery');
       if (savedGallery) setGallery(JSON.parse(savedGallery));
    } catch(e) { console.error("Gallery load error", e); }
  }, []);

  // Save Gallery to LocalStorage
  const addToGallery = (item: GalleryItem) => {
    const updated = [item, ...gallery];
    setGallery(updated);
    localStorage.setItem('nc_gallery', JSON.stringify(updated.slice(0, 50))); // Limit to 50 items
  };

  const getColorName = (hex: string): string => {
    const colors: {[key: string]: string} = {
      '#ffffff': 'white', '#000000': 'black', '#ef4444': 'red', '#f97316': 'orange',
      '#eab308': 'yellow', '#22c55e': 'green', '#3b82f6': 'blue', '#6366f1': 'indigo',
      '#a855f7': 'purple', '#ec4899': 'pink'
    };
    return colors[hex.toLowerCase()] || 'colored';
  };

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

  // --- Workspace Logic ---

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setView('editor');
  };

  const handleCreateNew = (template?: Template) => {
    setCurrentProject({
      id: Date.now().toString(),
      name: template ? `${template.name} Project` : 'Untitled Project',
      data: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    setInitialTemplatePrompt(template?.promptTemplate || '');
    setView('editor');
  };

  const handleSaveProject = () => {
     if (!fabricRef.current) return;
     const json = fabricRef.current.toJSON(['aiData']); // Include aiData in save
     const dataURL = fabricRef.current.toDataURL({ format: 'jpeg', quality: 0.5, multiplier: 0.2 }); // Small thumb
     
     const updatedProject: Project = {
       id: currentProject?.id || Date.now().toString(),
       name: currentProject?.name || 'Untitled Project',
       thumbnail: dataURL,
       data: json,
       createdAt: currentProject?.createdAt || Date.now(),
       updatedAt: Date.now()
     };
     
     // Save to local storage
     const existing = localStorage.getItem('nc_projects');
     let projects: Project[] = existing ? JSON.parse(existing) : [];
     const index = projects.findIndex(p => p.id === updatedProject.id);
     if (index >= 0) projects[index] = updatedProject;
     else projects.unshift(updatedProject);
     
     localStorage.setItem('nc_projects', JSON.stringify(projects));
     setCurrentProject(updatedProject);
     alert("Project Saved!");
  };

  // -----------------------

  useEffect(() => {
    if (view !== 'editor') return;

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

      if (!(fabric.Object.prototype as any).controls) {
        (fabric.Object.prototype as any).controls = {} as any;
      }
      (fabric.Object.prototype as any).controls.aiInfo = new fabric.Control({
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
          if (!fabricObject.aiData) return;
          const size = 16;
          ctx.save();
          ctx.translate(left, top);
          ctx.beginPath();
          ctx.arc(0, 0, size/2 + 2, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-4, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.arc(4, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      const initFabric = () => {
         const canvas = new fabric.Canvas(canvasRef.current, {
          width: containerRef.current?.clientWidth || window.innerWidth,
          height: containerRef.current?.clientHeight || window.innerHeight,
          backgroundColor: '#ffffff',
          selection: true,
          preserveObjectStacking: true,
          fireRightClick: true,
          stopContextMenu: true
        });

        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const ctx = patternCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(10, 10, 1, 0, Math.PI * 2);
          ctx.fill();
        }
        
        const gridPattern = new fabric.Pattern({
          source: patternCanvas,
          repeat: 'repeat'
        });
        (canvas as any).backgroundColor = gridPattern;
        canvas.requestRenderAll();
        fabricRef.current = canvas;

        // --- Load JSON State ---
        const stateToLoad = currentProject?.data && Object.keys(currentProject.data).length > 0 ? currentProject.data : initialCanvasState;
        
        if (stateToLoad) {
          canvas.loadFromJSON(stateToLoad, () => {
             canvas.renderAll();
             console.log("Canvas state loaded.");
          });
        }
        // -----------------------

        let isDragging = false;
        let isDrawingShape = false;
        let shapeOriginX = 0;
        let shapeOriginY = 0;
        let activeShape: any = null;
        let lastPosX = 0;
        let lastPosY = 0;

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

        canvas.on('mouse:down', function(opt: any) {
          const evt = opt.e;
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
          setPromptPopup(prev => ({ ...prev, visible: false }));

          if (evt.altKey === true) {
            isDragging = true;
            canvas.selection = false;
            lastPosX = evt.clientX;
            lastPosY = evt.clientY;
            return;
          }

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
             canvas.selection = false; 
          } else if (tool === 'text') {
             const text = new fabric.IText('Type Here', {
               left: pointer.x,
               top: pointer.y,
               fontFamily: 'Inter',
               fill: props.fill || '#000000',
               fontSize: props.fontSize || 32,
             });
             canvas.add(text);
             canvas.setActiveObject(text);
             setActiveTool('select');
          }
        });

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

        canvas.on('mouse:up', function(opt: any) {
          canvas.setViewportTransform(canvas.viewportTransform);
          isDragging = false;
          if (isDrawingShape) {
             isDrawingShape = false;
             if (activeShape) {
                activeShape.setCoords();
                if ((activeShape.width || 0) < 5 && (activeShape.radius || 0) < 5) {
                   canvas.remove(activeShape);
                } else {
                   canvas.setActiveObject(activeShape);
                   setHasSelection(true);
                }
             }
             activeShape = null;
             canvas.selection = true;
             setActiveTool('select');
          }
        });

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
  }, [view, currentProject]); // Re-initialize when view or project changes

  useEffect(() => {
     if (fabricRef.current) {
        (fabricRef.current as any).customTool = activeTool;
        (fabricRef.current as any).customProps = selectedProperties;
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

  const handlePropertyChange = (key: keyof SelectedProperties, value: any) => {
    setSelectedProperties(prev => ({ ...prev, [key]: value }));
    if (fabricRef.current) {
       const canvas = fabricRef.current;
       const activeObj = canvas.getActiveObject();
       if (key === 'stroke' && canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = value;
       if (key === 'strokeWidth' && canvas.freeDrawingBrush) canvas.freeDrawingBrush.width = value;
       if (activeObj) {
          if (key === 'stroke') { if (activeObj.type !== 'i-text') activeObj.set('stroke', value); } 
          else if (key === 'strokeWidth') { if (activeObj.type !== 'i-text') activeObj.set('strokeWidth', value); } 
          else if (key === 'fill') { if (activeObj.type === 'i-text' || activeObj.type === 'text') activeObj.set('fill', value); } 
          else if (key === 'fontSize') { if (activeObj.type === 'i-text' || activeObj.type === 'text') activeObj.set('fontSize', value); }
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

  const handleGenerate = async (prompt: string, model: ModelType) => {
    if (!fabricRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = fabricRef.current;
      const activeObj = canvas.getActiveObject();
      let imagesPayload: string[] = [];
      let finalPrompt = prompt;
      let targetX = 0;
      let targetY = 0;
      let visualWidth = 0;
      let refWidth = 0;
      let refHeight = 0;

      if (activeObj) {
        const objs = activeObj.type === 'activeSelection' ? activeObj.getObjects() : [activeObj];
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
           imagesPayload = objs.filter((o: any) => o.type === 'image').map((o: any) => {
                const iMax = Math.max(o.getScaledWidth(), o.getScaledHeight());
                const iMult = iMax < 1024 ? (1024/iMax) : 1;
                return o.toDataURL({ format: 'png', multiplier: iMult }).split(',')[1];
             });
        } else if (hasImages && hasShapes) {
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
        } else {
           const flatBase64 = activeObj.toDataURL({ format: 'png', multiplier: calculatedMultiplier }).split(',')[1];
           imagesPayload = [flatBase64];
        }
      } else {
        visualWidth = 400; 
        refWidth = canvas.width;
        refHeight = canvas.height;
        const vpt = canvas.viewportTransform;
        targetX = (-vpt[4] + canvas.width / 2) / vpt[0] - (visualWidth / 2);
        targetY = (-vpt[5] + canvas.height / 2) / vpt[3] - (visualWidth / 2);
        if (model !== ModelType.VEO_FAST && model !== ModelType.VEO_HQ) {
            const base64 = canvas.toDataURL({ format: 'png' }).split(',')[1];
            imagesPayload = [base64];
        }
      }

      if (model === ModelType.VEO_FAST || model === ModelType.VEO_HQ) {
         const videoUrl = await aiService.generateVideoContent({ prompt: finalPrompt, model, images: imagesPayload });
         
         // Add to Gallery
         addToGallery({
            id: Date.now().toString(),
            url: videoUrl,
            prompt: finalPrompt,
            model: model,
            timestamp: Date.now(),
            type: 'video'
         });

         const videoEl = document.createElement('video');
         videoEl.src = videoUrl;
         videoEl.crossOrigin = 'anonymous';
         videoEl.loop = true;
         videoEl.muted = true;
         videoEl.width = 1280;
         videoEl.height = 720;
         videoEl.play();
         const fabricVid = new window.fabric.Image(videoEl, { left: targetX, top: targetY, objectCaching: false });
         if (visualWidth > 0) fabricVid.scaleToWidth(visualWidth);
         else fabricVid.scaleToWidth(400);
         fabricVid.set('aiData', { prompt: finalPrompt, model: model, timestamp: Date.now() } as AIData);
         canvas.add(fabricVid);
         canvas.setActiveObject(fabricVid);
         canvas.renderAll();
         setHasSelection(true);
         return;
      }

      const { imageBase64 } = await aiService.generateContent({ prompt: finalPrompt, model, images: imagesPayload, referenceWidth: refWidth, referenceHeight: refHeight });
      if (imageBase64) {
        const imageUrl = `data:image/png;base64,${imageBase64}`;
        
        // Add to Gallery
        addToGallery({
            id: Date.now().toString(),
            url: imageUrl,
            prompt: finalPrompt,
            model: model,
            timestamp: Date.now(),
            type: 'image'
        });

        window.fabric.Image.fromURL(imageUrl, (img: any) => {
          if (visualWidth > 0) img.scaleToWidth(visualWidth);
          img.set({ left: targetX, top: targetY });
          img.set('aiData', { prompt: finalPrompt, model: model, timestamp: Date.now() } as AIData);
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
          setHasSelection(true);
        });
      }
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate content. See console for details.");
      throw error;
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
    <>
      <style>
        {`
        #nc-root {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -moz-tab-size: 4;
          tab-size: 4;
        }
        #nc-root *, #nc-root ::before, #nc-root ::after {
          box-sizing: border-box;
          border-width: 0;
          border-style: solid;
          border-color: #e5e7eb;
        }
        `}
      </style>
      <div id="nc-root" className="relative w-full h-full bg-slate-50 text-slate-800 isolate overflow-hidden">
        {view === 'workspace' ? (
          <Workspace 
            onOpenProject={handleOpenProject} 
            onCreateNew={handleCreateNew} 
            gallery={gallery}
          />
        ) : (
          <>
            <Toolbar 
              activeTool={activeTool} 
              onSelectTool={setActiveTool} 
              onDelete={handleDeleteSelection}
              onDownload={handleDownloadSelection}
              onUploadImage={handleUploadImage}
              onSaveProject={handleSaveProject}
              onHome={() => setView('workspace')}
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
            <PromptPopup 
              visible={promptPopup.visible}
              x={promptPopup.x}
              y={promptPopup.y}
              prompt={promptPopup.prompt}
              onClose={() => setPromptPopup(prev => ({ ...prev, visible: false }))}
            />
            <div ref={containerRef} className="absolute inset-0 z-0 bg-white">
              <canvas ref={canvasRef} />
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0B1220]/80 backdrop-blur px-6 py-2 rounded-full text-[10px] text-slate-300 pointer-events-none border border-white/20 select-none shadow-lg">
                {currentProject?.name} • Right-click objects for AI actions • Alt+Drag to Pan
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default App;
