'use client';

import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GestureCaptureProps {
  onCapture: (imageData: string) => void;
  currentImage?: string;
}

export function GestureCapture({ onCapture, currentImage }: GestureCaptureProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [fingerCount, setFingerCount] = useState(0);
  const [gestureSequence, setGestureSequence] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [status, setStatus] = useState('Show 1 finger to start');
  const webcamRef = useRef<Webcam>(null);
  const [handLandmarker, setHandLandmarker] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const animationFrameId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isModalOpen && !handLandmarker) {
      loadMediaPipeModel();
    }
    
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isModalOpen]);

  const loadMediaPipeModel = async () => {
    setIsModelLoading(true);
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });

      setHandLandmarker(landmarker);
      setIsModelLoading(false);
    } catch (error) {
      console.error('Error loading MediaPipe model:', error);
      setStatus('Error loading gesture detection. Using manual capture.');
      setIsModelLoading(false);
    }
  };

  const countFingers = (landmarks: any) => {
    if (!landmarks || landmarks.length === 0) return 0;

    const hand = landmarks[0];
    let count = 0;

    // Thumb: Check if tip is to the right (for right hand) or left (for left hand) of IP joint
    const thumbTip = hand[4];
    const thumbIP = hand[3];
    if (Math.abs(thumbTip.x - thumbIP.x) > 0.03) {
      count++;
    }

    // Other fingers: Check if tip is above PIP joint
    const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
    const fingerPIPs = [6, 10, 14, 18];

    for (let i = 0; i < fingerTips.length; i++) {
      if (hand[fingerTips[i]].y < hand[fingerPIPs[i]].y - 0.03) {
        count++;
      }
    }

    return count;
  };

  const detectGesture = async () => {
    if (!webcamRef.current || !webcamRef.current.video || !handLandmarker) {
      return;
    }

    const video = webcamRef.current.video;
    if (video.readyState === 4) {
      const results = handLandmarker.detectForVideo(video, Date.now());
      
      if (results.landmarks && results.landmarks.length > 0) {
        const fingers = countFingers(results.landmarks);
        setFingerCount(fingers);

        // Track gesture sequence: 1 -> 2 -> 3
        setGestureSequence((prev) => {
          const newSeq = [...prev];
          
          if (fingers === 1 && (prev.length === 0 || prev[prev.length - 1] !== 1)) {
            newSeq.push(1);
            setStatus('Great! Now show 2 fingers');
          } else if (fingers === 2 && prev[prev.length - 1] === 1) {
            newSeq.push(2);
            setStatus('Perfect! Now show 3 fingers');
          } else if (fingers === 3 && prev[prev.length - 1] === 2) {
            newSeq.push(3);
            setStatus('Capturing...');
            startCountdown();
            return newSeq;
          }
          
          return newSeq;
        });
      } else {
        setFingerCount(0);
      }
    }

    if (isCapturing && !countdown) {
      animationFrameId.current = requestAnimationFrame(detectGesture);
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    
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
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
        setIsCapturing(false);
        setStatus('Photo captured! Review and save or retake.');
      }
    }
  };

  const startCapture = () => {
    setIsCapturing(true);
    setGestureSequence([]);
    setFingerCount(0);
    setStatus('Show 1 finger to start');
    if (handLandmarker) {
      detectGesture();
    }
  };

  const handleManualCapture = () => {
    capturePhoto();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setGestureSequence([]);
    setFingerCount(0);
    setStatus('Show 1 finger to start');
    startCapture();
  };

  const handleSave = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setIsModalOpen(false);
      setCapturedImage(null);
      setIsCapturing(false);
    }
  };

  return (
    <div>
      {/* Current Image Preview */}
      {currentImage ? (
        <div className="space-y-2">
          <div className="relative w-48 h-48 mx-auto">
            <img
              src={currentImage}
              alt="Profile"
              className="w-full h-full object-cover rounded-lg border-2 border-gray-300"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="w-full"
          >
            <CameraIcon className="w-4 h-4 mr-2" />
            Change Photo
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="w-full"
        >
          <CameraIcon className="w-4 h-4 mr-2" />
          Capture Photo with Gesture
        </Button>
      )}

      {/* Capture Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Capture Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isModelLoading && (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading gesture detection model...</p>
              </div>
            )}

            {!capturedImage ? (
              <>
                {/* Webcam Preview */}
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full rounded-lg"
                    videoConstraints={{
                      width: 1280,
                      height: 720,
                      facingMode: 'user',
                    }}
                  />
                  
                  {/* Gesture Overlay */}
                  {isCapturing && (
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black/70 text-white px-4 py-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{status}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {[1, 2, 3].map((num) => (
                                <div
                                  key={num}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                                    gestureSequence.includes(num)
                                      ? 'bg-green-500'
                                      : 'bg-gray-600'
                                  }`}
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                          </div>
                          {countdown !== null && (
                            <div className="text-4xl font-bold">{countdown}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finger Count Display */}
                  {isCapturing && fingerCount > 0 && (
                    <div className="absolute bottom-4 right-4">
                      <div className="bg-blue-500 text-white px-6 py-3 rounded-full text-2xl font-bold">
                        {fingerCount} 🖐️
                      </div>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  {!isCapturing ? (
                    <>
                      <Button
                        type="button"
                        onClick={startCapture}
                        className="flex-1"
                        disabled={isModelLoading}
                      >
                        Start Gesture Capture
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleManualCapture}
                        className="flex-1"
                      >
                        <CameraIcon className="w-4 h-4 mr-2" />
                        Manual Capture
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCapturing(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                <p className="text-sm text-gray-600 text-center">
                  For gesture capture: Show 1 finger, then 2 fingers, then 3 fingers to auto-capture
                </p>
              </>
            ) : (
              <>
                {/* Preview Captured Image */}
                <div className="relative">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full rounded-lg"
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
}
