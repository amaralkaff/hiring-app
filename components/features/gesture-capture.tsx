'use client';

import { FC, useEffect, useRef, useState, useCallback } from 'react';
import { ArrowPathIcon, CheckIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GestureCaptureProps {
  onCapture: (imageData: string) => void;
  currentImage?: string;
}

const GestureController: FC<GestureCaptureProps> = (props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fingerCount, setFingerCount] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [gestureSequence, setGestureSequence] = useState<number[]>([]);
  const [lastDetectedGesture, setLastDetectedGesture] = useState(0);
  const [gestureStableTime, setGestureStableTime] = useState(0);
  const [expectedGesture, setExpectedGesture] = useState(1);
  
  // Function declarations - move all useCallback functions to the top

  const initializeCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current) {
            canvasRef.current.width = videoRef.current!.videoWidth;
            canvasRef.current.height = videoRef.current!.videoHeight;
          }
        };
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Error initializing camera:', err);
    }
  }, []);

  const loadMediaPipeModel = useCallback(async () => {
    setIsModelLoading(true);
    try {
      if (typeof window === 'undefined') {
        throw new Error('MediaPipe requires browser environment');
      }

      const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/hand_landmarker.task' // Use local file instead of remote
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.7
      });

      // Verify the landmarker is properly initialized before storing it
      if (handLandmarker && typeof handLandmarker.detectForVideo === 'function') {
        // Store landmarker in a way that persists
        (window as { handLandmarker?: unknown }).handLandmarker = handLandmarker;

        // Skip the warm-up step that's causing the error
        // The TensorFlow Lite delegate will be initialized on first use
        // This avoids the ROI width/height error with dummy video
        setTimeout(() => {
          setIsModelReady(true);
        }, 500);
      } else {
        throw new Error('Hand landmarker failed to initialize properly');
      }

      setIsModelLoading(false);
    } catch (error: unknown) {
      console.error('Error loading MediaPipe model:', error);
      setIsModelLoading(false);
    }
  }, []);

  const turnOffWebcam = useCallback(() => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop(); // Properly stop each track
      });
      video.srcObject = null; // Clear the srcObject
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current &&
        videoRef.current.videoWidth > 0 &&
        videoRef.current.videoHeight > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);

        // Auto-turn off webcam after capturing photo
        turnOffWebcam();
        setCapturing(false);
      }
    }
  }, [turnOffWebcam]);

  const startCountdown = useCallback(() => {
    let count = 3;
    setCountdown(count);
    // Stop finger detection when countdown starts
    setCapturing(false);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(interval);
        capturePhoto();
      }
    }, 1000);
  }, [capturePhoto]);

  useEffect(() => {
    if (isModalOpen) {
      initializeCamera();
      loadMediaPipeModel();

      // Set up global console filtering for MediaPipe messages
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.error = (...args: unknown[]) => {
        const message = args.length > 0 ? String(args[0]) : '';
        if (message.includes('Created TensorFlow Lite XNNPACK delegate for CPU') ||
            message.includes('ROI width and height must be > 0') ||
            message.includes('Using NORM_RECT without IMAGE_DIMENSIONS') ||
            message.includes('Feedback manager requires a model with a single signature inference')) {
          return; // Silently ignore these MediaPipe messages
        }
        originalConsoleError.apply(console, args);
      };

      console.warn = (...args: unknown[]) => {
        const message = args.length > 0 ? String(args[0]) : '';
        if (message.includes('Feedback manager requires a model with a single signature inference') ||
            message.includes('Using NORM_RECT without IMAGE_DIMENSIONS') ||
            message.includes('OpenGL error checking is disabled')) {
          return; // Silently ignore these MediaPipe warnings
        }
        originalConsoleWarn.apply(console, args);
      };

      // Also override console.log to catch vision_wasm_internal.js messages
      const originalConsoleLog = console.log;
      console.log = (...args: unknown[]) => {
        const message = args.length > 0 ? String(args[0]) : '';
        if (message.includes('GL version:') ||
            message.includes('Graph successfully started running')) {
          return; // Silently ignore these MediaPipe info messages
        }
        originalConsoleLog.apply(console, args);
      };

      // Store original log function to restore later
      (window as { _originalConsoleLog?: typeof console.log })._originalConsoleLog = originalConsoleLog;

      // Store original functions to restore later
      (window as { _originalConsoleError?: typeof console.error; _originalConsoleWarn?: typeof console.warn })._originalConsoleError = originalConsoleError;
      (window as { _originalConsoleWarn?: typeof console.warn })._originalConsoleWarn = originalConsoleWarn;
    }

    return () => {
      // Use the reusable turnOffWebcam function for consistency
      turnOffWebcam();
      // Reset model state when modal closes
      setIsModelReady(false);
      setIsModelLoading(false);
      // Reset gesture sequence state
      setGestureSequence([]);
      setLastDetectedGesture(0);
      setGestureStableTime(0);
      setExpectedGesture(1);
      // Clear the global landmarker
      (window as { handLandmarker?: unknown }).handLandmarker = null;

      // Restore original console functions
      if ((window as { _originalConsoleError?: typeof console.error })._originalConsoleError) {
        console.error = (window as unknown as { _originalConsoleError: typeof console.error })._originalConsoleError;
        delete (window as { _originalConsoleError?: typeof console.error })._originalConsoleError;
      }
      if ((window as { _originalConsoleWarn?: typeof console.warn })._originalConsoleWarn) {
        console.warn = (window as unknown as { _originalConsoleWarn: typeof console.warn })._originalConsoleWarn;
        delete (window as { _originalConsoleWarn?: typeof console.warn })._originalConsoleWarn;
      }
      if ((window as { _originalConsoleLog?: typeof console.log })._originalConsoleLog) {
        console.log = (window as unknown as { _originalConsoleLog: typeof console.log })._originalConsoleLog;
        delete (window as { _originalConsoleLog?: typeof console.log })._originalConsoleLog;
      }
    };
  }, [isModalOpen, initializeCamera, loadMediaPipeModel, turnOffWebcam]);

  // Auto-start finger detection when model is ready
  useEffect(() => {
    if (isModalOpen && isModelReady && !capturing) {
      setCapturing(true);
      setFingerCount(0);
    }
  }, [isModalOpen, isModelReady, capturing]);

  // Initialize frame loop when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    let raf = 0;
    let lastVideoTime = -1;

    
    const countFingers = (landmarks: { x: number; y: number }[]) => {
      if (!landmarks || landmarks.length === 0) return 0;
      
      let count = 0;
      
      // More accurate finger counting using MediaPipe hand landmarks
      // Check if finger tips are significantly above their respective PIP joints
      
      // Thumb: check if tip (4) is to the left of IP joint (3) for right hand (mirrored in camera)
      // or check if tip is significantly above IP joint
      if (landmarks[4].x < landmarks[3].x - 0.04 || landmarks[4].y < landmarks[3].y - 0.05) {
        count++;
      }
      
      // Index finger: check if tip (8) is above PIP joint (6) by a reasonable margin
      if (landmarks[8].y < landmarks[6].y - 0.04) {
        count++;
      }
      
      // Middle finger: check if tip (12) is above PIP joint (10) by a reasonable margin
      if (landmarks[12].y < landmarks[10].y - 0.04) {
        count++;
      }
      
      // Ring finger: check if tip (16) is above PIP joint (14) by a reasonable margin
      if (landmarks[16].y < landmarks[14].y - 0.04) {
        count++;
      }
      
      // Pinky: check if tip (20) is above PIP joint (18) by a reasonable margin
      if (landmarks[20].y < landmarks[18].y - 0.04) {
        count++;
      }
      
      // Only return counts for 1, 2, or 3 fingers
      // If 4 or more fingers are detected, return 0 to indicate invalid gesture
      if (count > 3) {
        return 0;
      }
      
      return count;
    };

    const drawLandmarks = function (res: { landmarks?: { x: number; y: number }[][] }) {
      const ctx = canvasRef.current?.getContext("2d");
      const video = videoRef.current;

      if (!ctx || !video) return;

      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw landmarks and finger rectangles
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00FF00';
      ctx.fillStyle = '#FF0000';

      const hands = res.landmarks ?? [];

      // Always draw bounding box and text if hand is detected
      if (hands.length > 0) {
        const points = Array.isArray(hands[0]) ? hands[0] : [];

        // Draw all landmark points with consistent styling
        ctx.fillStyle = '#FF0000';
        points.forEach((p: { x: number; y: number }) => {
          ctx.beginPath();
          ctx.arc(
            p.x * ctx.canvas.width,
            p.y * ctx.canvas.height,
            3,
            0,
            Math.PI * 2
          );
          ctx.fill();
        });
        
        // Draw bounding box around entire hand
        if (points.length > 0 && points[0]) {
          // Calculate bounding box
          let minX = points[0].x;
          let maxX = points[0].x;
          let minY = points[0].y;
          let maxY = points[0].y;

          points.forEach((point: { x: number; y: number }) => {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
          });
          
          // Add padding to the bounding box
          const padding = 0.05;
          minX = Math.max(0, minX - padding);
          maxX = Math.min(1, maxX + padding);
          minY = Math.max(0, minY - padding);
          maxY = Math.min(1, maxY + padding);
          
          // Convert to canvas coordinates
          const canvasX = minX * ctx.canvas.width;
          const canvasY = minY * ctx.canvas.height;
          const canvasWidth = (maxX - minX) * ctx.canvas.width;
          const canvasHeight = (maxY - minY) * ctx.canvas.height;
          
          // Draw hand bounding box with consistent styling
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 3;
          ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);
          
          // Get current finger count for this specific hand
          const currentFingerCount = countFingers(points);
          
          // Draw "Hand Detected" label with current finger count and sequence progress
          // Add highlight background with higher contrast
          ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Darker background for better contrast

          // Get sequence progress from state
          const sequenceProgress = gestureSequence.length;
          const nextExpected = expectedGesture;

          let text = '';
          if (currentFingerCount === 0) {
            if (sequenceProgress === 0) {
              text = 'Show 1 finger to start (1/3)';
            } else if (sequenceProgress === 1) {
              text = 'Show 2 fingers (2/3)';
            } else if (sequenceProgress === 2) {
              text = 'Show 3 fingers (3/3)';
            } else {
              text = 'Sequence complete!';
            }
          } else if (currentFingerCount === 1) {
            if (sequenceProgress === 0 && nextExpected === 1) {
              text = '✓ Hold 1 finger... (1/3)';
            } else {
              text = '1 finger detected';
            }
          } else if (currentFingerCount === 2) {
            if (sequenceProgress === 1 && nextExpected === 2) {
              text = '✓ Hold 2 fingers... (2/3)';
            } else {
              text = '2 fingers detected';
            }
          } else if (currentFingerCount === 3) {
            if (sequenceProgress === 2 && nextExpected === 3) {
              text = '✓ Hold 3 fingers... (3/3)';
            } else {
              text = '3 fingers detected';
            }
          } else {
            text = 'Invalid gesture - show 1, 2, or 3 fingers';
          }
          
          // Measure text to create background rectangle
          ctx.font = 'bold 20px Arial'; // Larger font for better visibility
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = 28;
          const textPadding = 12;
          
          // Draw background rectangle with more padding
          ctx.fillRect(canvasX - textPadding/2, canvasY - textHeight - textPadding, textWidth + textPadding, textHeight + textPadding);
          
          // Draw text with higher contrast
          ctx.fillStyle = '#00FF00'; // Bright green text
          ctx.strokeStyle = '#000000'; // Black outline for better contrast
          ctx.lineWidth = 2;
          ctx.strokeText(text, canvasX, canvasY - 10);
          ctx.fillText(text, canvasX, canvasY - 10);
        }
      }
    };

    // Function to draw just video without landmarks
    const drawVideoOnly = function () {
      const ctx = canvasRef.current?.getContext("2d");
      const video = videoRef.current;

      if (!ctx || !video) return;

      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    const actOnResults = function (res: { landmarks?: { x: number; y: number }[][] }) {
      const hands = res.landmarks ?? [];
      let count = 0;

      if (hands.length > 0) {
        const points = Array.isArray(hands[0]) ? hands[0] : [];
        count = countFingers(points);
      }

      setFingerCount(count);

      const currentTime = Date.now();

      // Only count valid gestures (1, 2, or 3 fingers)
      if (count > 0 && count <= 3) {
        // Check if this is the same gesture as before
        if (count === lastDetectedGesture) {
          // If gesture is stable for at least 800ms, consider it detected
          if (currentTime - gestureStableTime > 800) {
            // Check if this is the expected gesture in sequence
            if (count === expectedGesture) {
              // Add to sequence
              const newSequence = [...gestureSequence, count];
              setGestureSequence(newSequence);
              setLastDetectedGesture(0); // Reset to prevent multiple triggers
              setGestureStableTime(0);

              // If we've detected 1-2-3 sequence, start countdown
              if (newSequence.length === 3) {
                // Clear the reference image and start countdown
                setTimeout(() => {
                  startCountdown();
                }, 500); // Small delay before starting countdown
              } else {
                // Move to next expected gesture
                setExpectedGesture(count + 1);
              }
            }
          }
        } else {
          // New gesture detected, start stability timer
          setLastDetectedGesture(count);
          setGestureStableTime(currentTime);
        }
      } else {
        // No valid gesture, reset timers but keep sequence progress
        if (count === 0 && currentTime - gestureStableTime > 1500) {
          // Reset if no gesture for 1.5 seconds
          setLastDetectedGesture(0);
          setGestureStableTime(0);
        }
      }
    };

    const frame = () => {
      const video = videoRef.current;
      const globalLandmarker = (window as { handLandmarker?: { detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks?: { x: number; y: number }[][] } } }).handLandmarker;
      if (!video) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const now = performance.now();

      // Always draw video frame to ensure canvas is never blank
      if (video.readyState === 4 && video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          // Only run hand detection if capturing and landmarker is available and ready
          if (capturing && globalLandmarker && typeof globalLandmarker.detectForVideo === 'function' &&
              video.currentTime !== lastVideoTime && isModelReady) {
            // Check if the landmarker is ready by testing a simple detection first
            if (!globalLandmarker || typeof globalLandmarker.detectForVideo !== 'function') {
              drawVideoOnly();
              raf = requestAnimationFrame(frame);
              return;
            }
            
            try {
              const result = globalLandmarker.detectForVideo(video, now);
              
              if (result && result.landmarks) {
                drawLandmarks(result);
                actOnResults(result);
              } else {
                drawVideoOnly();
              }
              lastVideoTime = video.currentTime;
            } catch (error: unknown) {
              // Filter out TensorFlow Lite and MediaPipe initialization messages
              const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message?: string }).message || '' : '';
              if (errorMessage.includes('Created TensorFlow Lite XNNPACK delegate for CPU') ||
                  errorMessage.includes('ROI width and height must be > 0') ||
                  errorMessage.includes('Using NORM_RECT without IMAGE_DIMENSIONS')) {
                // These are initialization messages, not actual errors
                raf = requestAnimationFrame(frame);
                return;
              }
              console.error('Error during hand detection:', error);
              // Just draw video frame on error
              drawVideoOnly();
            }
          } else {
            // Just draw video frame if not capturing or landmarker is not available
            drawVideoOnly();
          }
        } catch (error) {
          console.error('Error during hand detection:', error);
          // Just draw video frame on error
          drawVideoOnly();
        }
      }
      raf = requestAnimationFrame(frame);
    };

    // Start frame loop after a short delay to ensure landmarker is initialized
    setTimeout(() => {
      raf = requestAnimationFrame(frame);
    }, 100);

    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [isModalOpen, capturing, isModelLoading, isModelReady, startCountdown, gestureSequence, lastDetectedGesture, gestureStableTime, expectedGesture]);

  
  
  const handleRetake = () => {
    setCapturedImage(null);
    setFingerCount(0);
    setCapturing(false);
    setGestureSequence([]);
    setLastDetectedGesture(0);
    setGestureStableTime(0);
    setExpectedGesture(1);

    // Turn off webcam before retaking
    turnOffWebcam();
    
    // Turn on webcam with fresh stream
    const turnOnWebcam = async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video) return;
        
        // Get new stream
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        
        // Assign new stream to video
        video.srcObject = newStream;
        
        // Wait for video to be ready
        video.onloadedmetadata = () => {
          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        };
        
        await video.play();
      } catch (error) {
        console.error('Error turning on webcam:', error);
      }
    };
    
    // Reset MediaPipe model to ensure it's ready for retake
    const resetMediaPipe = async () => {
      try {
        // Check if landmarker exists and is ready
        const globalLandmarker = (window as { handLandmarker?: unknown }).handLandmarker;
        if (!globalLandmarker) {
          // If landmarker doesn't exist, reload the model
          setIsModelReady(false);
          setIsModelLoading(true);
          await loadMediaPipeModel();
        } else {
          // If landmarker exists, just ensure it's ready
          setIsModelReady(true);
        }
      } catch (error) {
        console.error('Error resetting MediaPipe:', error);
      }
    };
    
    // Execute turn off then on sequence
    turnOffWebcam();
    
    // Small delay to ensure webcam is fully off before turning back on
    setTimeout(async () => {
      await turnOnWebcam();
      await resetMediaPipe();
      // Auto-start finger detection after retake
      setTimeout(() => {
        setCapturing(true);
        setFingerCount(0);
        setGestureSequence([]);
        setLastDetectedGesture(0);
        setGestureStableTime(0);
        setExpectedGesture(1);
      }, 500);
    }, 300);
  };

  const handleSave = () => {
    if (capturedImage) {
      props.onCapture(capturedImage);
      setIsModalOpen(false);
      setCapturedImage(null);
      setCapturing(false);
        setGestureSequence([]);
        setLastDetectedGesture(0);
        setGestureStableTime(0);
        setExpectedGesture(1);

      // Ensure webcam is turned off after saving
      turnOffWebcam();
    }
  };

  return (
    <div>
      {/* Current Image Preview */}
      {props.currentImage ? (
        <div className="space-y-4">
          <div className="flex justify-start">
            <Avatar className="w-32 h-32 border-4 border-gray-200 shadow-lg">
              <AvatarImage
                src={props.currentImage}
                alt="Profile"
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-2xl">
                👤
              </AvatarFallback>
            </Avatar>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="w-full font-bold"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Take a Picture
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-start">
            <Avatar className="w-32 h-32 border-4 border-gray-200 shadow-lg">
              <AvatarFallback className="bg-gray-100">
                <Image
                  src="/avatar.png"
                  alt="Default avatar"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </AvatarFallback>
            </Avatar>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="w-full font-bold"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Take a Picture
          </Button>
        </div>
      )}

      {/* Capture Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Raise Your Hand to Capture </DialogTitle>
            <DialogDescription>
              We’ll take the photo once your hand pose is detected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isModelLoading && (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading gesture detection model...</p>
              </div>
            )}

            {!capturedImage ? (
              <>
                {/* Video and Canvas Container */}
                <div className="relative">
                  {/* Hidden video element for MediaPipe */}
                  <video
                    ref={videoRef}
                    className="hidden"
                    playsInline
                    autoPlay
                    muted
                    width="1280"
                    height="720"
                  />
                  
                  {/* Canvas overlay for video display and hand landmarks */}
                  <canvas
                    ref={canvasRef}
                    className="w-full rounded-lg"
                    width="1280"
                    height="720"
                  />
                  
                  {/* Real-time Gesture Status */}
                  <div className="absolute top-4 left-4 right-4">
                    <div className="text-white px-4 py-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>

                          {/* Always show current detected finger count */}
                          {fingerCount > 0 && (
                            <div className="mt-2">
                              <div className="bg-black bg-opacity-80 rounded-lg px-3 py-2 inline-block">
                                <p className="text-lg font-bold text-white">
                                  {fingerCount} {fingerCount === 1 ? 'finger' : 'fingers'} detected
                                </p>
                              </div>
                            </div>
                          )}
                          {fingerCount === 0 && (
                            <div className="mt-2">
                              <div className="bg-black bg-opacity-80 rounded-lg px-3 py-2 inline-block">
                                <p className="text-sm font-semibold text-yellow-300">
                                  {gestureSequence.length === 0 ? 'Show 1 finger to start (1/3)' :
                                   gestureSequence.length === 1 ? 'Show 2 fingers (2/3)' :
                                   gestureSequence.length === 2 ? 'Show 3 fingers (3/3)' :
                                   'Show 1, 2, or 3 fingers'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        </div>
                    </div>
                  </div>

                  {/* Countdown Display - Top Right */}
                  <div className="absolute top-4 right-4">
                    {countdown !== null && (
                      <span className="text-6xl text-black">{countdown}</span>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="mt-6">
                    {isModelLoading && (
                      <div className="text-center py-2">
                        <p className="text-gray-600">Starting finger detection automatically...</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 text-sm text-gray-600 text-start space-y-2">
                    <p className="text-base">
                     To take a picture, follow the hand poses in the order shown below. The system will automatically capture the image once the final pose is detected.
                    </p>
                    <div className="flex justify-center items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <Image src="/finger-1.png" alt="1 finger" width={64} height={64} className="w-16 h-16" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Image src="/finger-2.png" alt="2 fingers" width={64} height={64} className="w-16 h-16" />
                      </div>
                      <div className="flex flex-col items-center">
                        <Image src="/finger-3.png" alt="3 fingers" width={64} height={64} className="w-16 h-16" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Preview Captured Image */}
                <div className="relative">
                  <Image
                    src={capturedImage}
                    alt="Captured"
                    width={400}
                    height={300}
                    className="w-full rounded-lg"
                    unoptimized
                  />
                </div>

                {/* Save/Retake Controls */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetake}
                    className="flex-1"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    className="flex-1"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Use This Photo
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function GestureCapture(props: GestureCaptureProps) {
  return <GestureController {...props} />;
}
