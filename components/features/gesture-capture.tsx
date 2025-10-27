'use client';

import { FC, useEffect, useRef, useState, useCallback } from 'react';
import { ArrowPathIcon, CheckIcon, ArrowUpTrayIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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

        // Handle video playback errors gracefully
        videoRef.current.addEventListener('error', (e) => {
          console.warn('Video element error:', e);
        });

        // Attempt to play video with error handling
        try {
          await videoRef.current.play();
        } catch (playError: unknown) {
          const errorMessage = playError && typeof playError === 'object' && 'message' in playError ?
            (playError as { message?: string }).message || '' : '';

          if (errorMessage.includes('The play() request was interrupted') ||
              errorMessage.includes('AbortError')) {
            // This is expected during rapid component updates
            console.warn('Video play interrupted, this is normal');
          } else {
            console.warn('Video play failed:', playError);
          }
          // Don't throw the error, just continue - video will play when ready
        }
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
    if (video) {
      // Pause video to prevent playback errors
      try {
        video.pause();
      } catch (error) {
        // Ignore pause errors
        console.warn('Video pause error:', error);
      }

      // Clear source object to prevent interruption errors
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop(); // Properly stop each track
        });
        video.srcObject = null; // Clear the srcObject
      }

      // Clear video source
      video.src = '';
      video.load(); // Reset video element
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
      const fingersUp: string[] = [];

      // Finger detection using proper MediaPipe landmark comparisons
      // Based on the principle: fingertip landmark should be higher (lower Y) than joint landmark

      // FIRST: Check if index finger is up - this determines thumb detection eligibility
      const indexUp = landmarks[8].y < landmarks[6].y - 0.015; // Index finger up

      // ONLY detect thumb if index finger is definitively down
      if (!indexUp) {
        // Thumb detection (Finger 1) - REGULAR THUMB UP GESTURE ONLY
        // Use proper MediaPipe thumb detection: check if thumb tip is to the left of thumb IP joint
        const thumbTip = landmarks[4];
        const thumbIP = landmarks[3]; // Thumb IP (interphalangeal) joint
        const thumbMCP = landmarks[2]; // Thumb MCP (metacarpophalangeal) joint

        // Proper thumb up detection: thumb tip should be left of thumb IP joint
        // This indicates thumb is extended outward, not making love gesture
        const thumbExtended = thumbTip.x < thumbIP.x - 0.03;

        // Additional check: thumb should be extended away from palm
        const thumbAwayFromPalm = thumbTip.x < thumbMCP.x - 0.02;

        // Distance check: ensure thumb is not too close to index finger tip
        const indexTip = landmarks[8];
        const thumbIndexDistance = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
          Math.pow(thumbTip.y - indexTip.y, 2)
        );

        // Final thumb detection with strict criteria:
        // 1. Thumb must be extended outward
        // 2. Thumb must be away from palm
        // 3. Thumb must be far from index finger (not love gesture)
        // 4. Other fingers must be down
        if (thumbExtended && thumbAwayFromPalm && thumbIndexDistance > 0.12) {
          // Check other fingers are down
          const middleDown = landmarks[12].y >= landmarks[10].y - 0.015;
          const ringDown = landmarks[16].y >= landmarks[14].y - 0.015;
          const pinkyDown = landmarks[20].y >= landmarks[18].y - 0.015;

          if (middleDown && ringDown && pinkyDown) {
            count++;
            fingersUp.push("Thumb");
          }
        }
      }

      // Index finger detection (Finger 2) - REQUIRED for all gestures
      // Check if tip (8) is higher than PIP joint (6)
      if (landmarks[8].y < landmarks[6].y - 0.025) {
        count++;
        fingersUp.push("Index");
      }

      // Middle finger detection (Finger 3) - REQUIRED for 2+ finger gestures
      // Check if tip (12) is higher than PIP joint (10)
      if (landmarks[12].y < landmarks[10].y - 0.025) {
        count++;
        fingersUp.push("Middle");
      }

      // Ring finger detection (Finger 4) - REQUIRED for 3 finger gesture
      // Check if tip (16) is higher than PIP joint (14)
      if (landmarks[16].y < landmarks[14].y - 0.025) {
        count++;
        fingersUp.push("Ring");
      }

      // Pinky finger detection (Finger 5) - IGNORED for our gesture sequence
      // We don't care about pinky for the 1-2-3 finger sequence
      // No pinky detection logic here

      // For our gesture sequence, we have updated requirements:
      // 1 finger = Index finger up OR Thumb up alone (but NOT thumb + index together)
      // 2 fingers = Index + Middle fingers up (other fingers don't matter)
      // 3 fingers = Index + Middle + Ring fingers up (other fingers don't matter)
      // IMPORTANT: Any combination with thumb + index together should return 0 (undetectable)

      // Check for specific gesture patterns (more relaxed requirements)
      const hasThumb = fingersUp.includes("Thumb");
      const hasIndex = fingersUp.includes("Index");
      const hasMiddle = fingersUp.includes("Middle");
      const hasRing = fingersUp.includes("Ring");

      // COMPLETELY EXCLUDE any gesture with thumb + index together
      if (hasThumb && hasIndex) {
        console.log('Thumb + Index detected - INVALID gesture, returning 0');
        return 0;
      }

      // Pattern 1: Index finger up (minimum requirement) OR Thumb up alone
      if (hasIndex && !hasMiddle && !hasRing && !hasThumb) {
        return 1;
      }
      // Thumb up alone (without index finger)
      if (hasThumb && !hasIndex && !hasMiddle && !hasRing) {
        return 1;
      }

      // Pattern 2: Index + Middle fingers up (minimum requirement)
      if (hasIndex && hasMiddle && !hasRing && !hasThumb) {
        return 2;
      }

      // Pattern 3: Index + Middle + Ring fingers up (exact requirement)
      if (hasIndex && hasMiddle && hasRing && !hasThumb) {
        return 3;
      }

      // Debug: Log detected fingers for troubleshooting
      if (fingersUp.length > 0) {
        console.log('Detected fingers:', fingersUp.join(', '), '| Total count:', count);
      }

      // Any other pattern is invalid for our sequence
      return 0;
    };

    const drawLandmarks = function (res: { landmarks?: { x: number; y: number }[][] }) {
      const ctx = canvasRef.current?.getContext("2d");
      const video = videoRef.current;

      if (!ctx || !video) return;

      // Clear canvas
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      // Draw video frame
      ctx.drawImage(video, 0, 0, ctx.canvas.width, ctx.canvas.height);

      const hands = res.landmarks ?? [];

      // Always draw bounding box and text if hand is detected
      if (hands.length > 0) {
        const points = Array.isArray(hands[0]) ? hands[0] : [];

        // Get current finger count for this specific hand
        const currentFingerCount = countFingers(points);

        // Enhanced visual feedback based on detection state
        let boxColor = '#FFA500'; // Orange for undetected/no gesture

        if (currentFingerCount > 0 && currentFingerCount <= 3) {
          // Valid gesture detected - use success colors
          boxColor = '#00FF00'; // Green
        }

        // Calculate bounding box variables outside the if block for scope
        let canvasX = 0, canvasY = 0, canvasWidth = 0, canvasHeight = 0;

        // Draw enhanced bounding box around entire hand with dynamic styling
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

          // Dynamic padding based on gesture confidence
          const padding = currentFingerCount > 0 ? 0.06 : 0.04;
          minX = Math.max(0, minX - padding);
          maxX = Math.min(1, maxX + padding);
          minY = Math.max(0, minY - padding);
          maxY = Math.min(1, maxY + padding);

          // Convert to canvas coordinates and assign to outer scope variables
          canvasX = minX * ctx.canvas.width;
          canvasY = minY * ctx.canvas.height;
          canvasWidth = (maxX - minX) * ctx.canvas.width;
          canvasHeight = (maxY - minY) * ctx.canvas.height;

          // Draw hand bounding box with enhanced visual feedback
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = currentFingerCount > 0 ? 4 : 3;
          ctx.strokeRect(canvasX, canvasY, canvasWidth, canvasHeight);

          // Add corner indicators for better visibility
          const cornerSize = 12;
          ctx.lineWidth = 3;
          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(canvasX, canvasY + cornerSize);
          ctx.lineTo(canvasX, canvasY);
          ctx.lineTo(canvasX + cornerSize, canvasY);
          ctx.stroke();
          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(canvasX + canvasWidth - cornerSize, canvasY);
          ctx.lineTo(canvasX + canvasWidth, canvasY);
          ctx.lineTo(canvasX + canvasWidth, canvasY + cornerSize);
          ctx.stroke();
          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(canvasX, canvasY + canvasHeight - cornerSize);
          ctx.lineTo(canvasX, canvasY + canvasHeight);
          ctx.lineTo(canvasX + cornerSize, canvasY + canvasHeight);
          ctx.stroke();
          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(canvasX + canvasWidth - cornerSize, canvasY + canvasHeight);
          ctx.lineTo(canvasX + canvasWidth, canvasY + canvasHeight);
          ctx.lineTo(canvasX + canvasWidth, canvasY + canvasHeight - cornerSize);
          ctx.stroke();
        } else {
          // If no hand detected, set default values for canvas coordinates
          canvasX = ctx.canvas.width / 2 - 100;
          canvasY = 100;
          canvasWidth = 200;
          canvasHeight = 200;
        }

        // Draw landmark points with enhanced visual feedback
        points.forEach((p: { x: number; y: number }, index) => {
          // Only consider index (8), middle (12), and ring (16) as finger tips
          // Completely exclude thumb (4) and pinky (20) from finger tip detection
          const isImportantFingerTip = [8, 12, 16].includes(index);
          const canvasX = p.x * ctx.canvas.width;
          const canvasY = p.y * ctx.canvas.height;

          // Determine which finger this is and if it's detected as "up"
          let fingerName = '';
          let isUp = false;

          if (isImportantFingerTip) {
            if (index === 8) { // Index finger (Finger 2) - IMPORTANT
              fingerName = 'Index';
              isUp = points[8].y < points[6].y - 0.025;
            } else if (index === 12) { // Middle finger (Finger 3) - IMPORTANT
              fingerName = 'Middle';
              isUp = points[12].y < points[10].y - 0.025;
            } else if (index === 16) { // Ring finger (Finger 4) - IMPORTANT
              fingerName = 'Ring';
              isUp = points[16].y < points[14].y - 0.025;
            }
          }

          ctx.beginPath();
          ctx.arc(canvasX, canvasY, isImportantFingerTip ? 5 : 3, 0, Math.PI * 2);

          if (isImportantFingerTip) {
            // Color based on detection state
            if (isUp && currentFingerCount > 0) {
              // Check if this finger is part of the current valid gesture
              const isValidForGesture =
                (currentFingerCount === 1 && fingerName === 'Index') ||
                (currentFingerCount === 2 && (fingerName === 'Index' || fingerName === 'Middle')) ||
                (currentFingerCount === 3 && (fingerName === 'Index' || fingerName === 'Middle' || fingerName === 'Ring'));

              if (isValidForGesture) {
                ctx.fillStyle = '#00FF00'; // Bright green for correctly detected fingers
              } else {
                ctx.fillStyle = '#FFA500'; // Orange for detected but not part of current gesture
              }
            } else {
              ctx.fillStyle = '#808080'; // Gray for fingers that are down
            }
          } else {
            // Thumb (4) and Pinky (20) - always show as regular landmarks (red)
            ctx.fillStyle = '#FF0000'; // Red for non-important finger landmarks
          }

          ctx.fill();

          // Add finger labels for detected up fingers
          if (isImportantFingerTip && isUp && currentFingerCount > 0) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(fingerName, canvasX + 8, canvasY - 8);
            ctx.fillText(fingerName, canvasX + 8, canvasY - 8);
          }
        });

        // Draw status label with enhanced visual feedback
        const sequenceProgress = gestureSequence.length;
        const nextExpected = expectedGesture;

        let text = '';
        let statusType = 'waiting'; // 'waiting', 'detected', 'success', 'error'

        if (currentFingerCount === 0) {
          if (sequenceProgress === 0) {
            text = '';
            statusType = 'waiting';
          } else if (sequenceProgress === 1) {
            text = 'Show 2 fingers (2/3)';
            statusType = 'waiting';
          } else if (sequenceProgress === 2) {
            text = 'Show 3 fingers (3/3)';
            statusType = 'waiting';
          } else {
            text = 'Sequence complete!';
            statusType = 'success';
          }
        } else if (currentFingerCount === 1) {
          if (sequenceProgress === 0 && nextExpected === 1) {
            text = '✓ Hold 1 finger... (1/3)';
            statusType = 'detected';
          } else {
            text = '1 finger detected';
            statusType = 'detected';
          }
        } else if (currentFingerCount === 2) {
          if (sequenceProgress === 1 && nextExpected === 2) {
            text = '✓ Hold 2 fingers... (2/3)';
            statusType = 'detected';
          } else {
            text = '2 fingers detected';
            statusType = 'detected';
          }
        } else if (currentFingerCount === 3) {
          if (sequenceProgress === 2 && nextExpected === 3) {
            text = '✓ Hold 3 fingers... (3/3)';
            statusType = 'detected';
          } else {
            text = '3 fingers detected';
            statusType = 'detected';
          }
        } else {
          text = 'Invalid gesture - show 1, 2, or 3 fingers';
          statusType = 'error';
        }

        // Enhanced background and text styling based on status
        let bgColor, txtColor, fontSize;
        switch (statusType) {
          case 'detected':
            bgColor = 'rgba(0, 255, 0, 0.9)'; // Green
            txtColor = '#000000'; // Black text for contrast
            fontSize = 'bold 22px Arial';
            break;
          case 'success':
            bgColor = 'rgba(0, 200, 0, 0.95)'; // Darker green
            txtColor = '#FFFFFF';
            fontSize = 'bold 24px Arial';
            break;
          case 'error':
            bgColor = 'rgba(255, 0, 0, 0.9)'; // Red
            txtColor = '#FFFFFF';
            fontSize = 'bold 20px Arial';
            break;
          default: // waiting
            bgColor = 'rgba(255, 165, 0, 0.9)'; // Orange
            txtColor = '#FFFFFF';
            fontSize = 'bold 20px Arial';
        }

        // Position the status box at the top center of the hand detection area
        const statusBoxX = canvasX + (canvasWidth / 2);
        const statusBoxY = canvasY - 60;

        // Measure text for proper background sizing
        ctx.font = fontSize;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = 30;
        const textPadding = 16;
        const borderRadius = 8;

        // Draw rounded background rectangle
        ctx.fillStyle = bgColor;
        const bgX = statusBoxX - (textWidth / 2) - textPadding;
        const bgY = statusBoxY - textHeight;
        const bgWidth = textWidth + (textPadding * 2);
        const bgHeight = textHeight + (textPadding * 2);

        // Simple rounded rectangle
        ctx.beginPath();
        ctx.moveTo(bgX + borderRadius, bgY);
        ctx.lineTo(bgX + bgWidth - borderRadius, bgY);
        ctx.lineTo(bgX + bgWidth, bgY + borderRadius);
        ctx.lineTo(bgX + bgWidth, bgY + bgHeight - borderRadius);
        ctx.lineTo(bgX + bgWidth - borderRadius, bgY + bgHeight);
        ctx.lineTo(bgX + borderRadius, bgY + bgHeight);
        ctx.lineTo(bgX, bgY + bgHeight - borderRadius);
        ctx.lineTo(bgX, bgY + borderRadius);
        ctx.closePath();
        ctx.fill();

        // Draw text with outline for better visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(text, statusBoxX - (textWidth / 2), statusBoxY + 10);
        ctx.fillStyle = txtColor;
        ctx.fillText(text, statusBoxX - (textWidth / 2), statusBoxY + 10);
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

      if (!video || video.paused || video.ended) {
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
              // Handle video playback interruption errors
              const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message?: string }).message || '' : '';
              if (errorMessage.includes('The play() request was interrupted by a new load request') ||
                  errorMessage.includes('AbortError') ||
                  errorMessage.includes('play() failed') ||
                  errorMessage.includes('The fetching process for the media resource was aborted')) {
                // These are video interruption errors - just continue
                console.warn('Video playback interrupted, continuing...');
                raf = requestAnimationFrame(frame);
                return;
              }
              // Filter out TensorFlow Lite and MediaPipe initialization messages
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
          // Handle video playback interruption errors
          const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as { message?: string }).message || '' : '';
          if (errorMessage.includes('The play() request was interrupted by a new load request') ||
              errorMessage.includes('AbortError') ||
              errorMessage.includes('play() failed')) {
            // These are video interruption errors - just continue
            console.warn('Video playback interrupted, continuing...');
            raf = requestAnimationFrame(frame);
            return;
          }
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
            <DialogTitle>Complete the Gesture Sequence to Capture Photo</DialogTitle>
            <DialogDescription>
              Show 1 finger → then 2 fingers → then 3 fingers. The photo will be captured automatically.
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
                              <p className="text-lg font-bold text-white">
                                {fingerCount} {fingerCount === 1 ? 'finger' : 'fingers'} detected
                              </p>
                            </div>
                          )}
                          {fingerCount === 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-semibold text-yellow-300">
                                  {gestureSequence.length === 0 ? '' :
                                   gestureSequence.length === 1 ? 'Show 2 fingers (2/3)' :
                                   gestureSequence.length === 2 ? 'Show 3 fingers (3/3)' :
                                   ''}
                                </p>
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
                      <ChevronRightIcon className="w-6 h-6 text-gray-400" />
                      <div className="flex flex-col items-center">
                        <Image src="/finger-2.png" alt="2 fingers" width={64} height={64} className="w-16 h-16" />
                      </div>
                      <ChevronRightIcon className="w-6 h-6 text-gray-400" />
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
