Act as an expert Python Computer Vision and AI developer. Write the complete, optimized, and bug-free Python script for an advanced virtual drawing system called "Project M.A.G.I.C." (Motion Activated Gestural Interface Canvas).

Please implement the exact logic below using OpenCV, MediaPipe, pyttsx3, and pytesseract:

1.  **Camera & Canvas Setup:**
    * Initialize the webcam with a resolution of 1280x720.
    * Flip the frame horizontally (`cv2.flip(img, 1)`) to create a natural mirror effect.
    * Create an `imgCanvas` (NumPy zeros array) of the exact same size.

2.  **Voice Assistant (No Lag):**
    * Initialize `pyttsx3`. Set the voice to the Female Voice (Index 1).
    * Create a `speak(text)` function that uses the `threading` module to run asynchronously, ensuring the video feed NEVER freezes.
    * Say "Welcome to Project Magic" on startup.

3.  **UI & Dynamic Color Selection (Bug Fix applied):**
    * Draw 4 color rectangles at the top of the screen (y=0 to 100):
        * Red (x=0 to 320)
        * Green (x=320 to 640)
        * Blue (x=640 to 960)
        * Yellow (x=960 to 1280)
    * Set the default `drawColor` to Blue.

4.  **Hand Tracking & Gestures (MediaPipe):**
    * Use `mediapipe.solutions.hands` with `max_num_hands=1`.
    * **Selection Mode (Index + Middle fingers UP):** If the tip of the Index finger (Landmark 8) enters the specific (x, y) boundaries of the top color rectangles, instantly change the `drawColor` to that rectangle's color. Draw a visual indicator (like a filled rectangle) to show it's selected.
    * **Draw Mode (Only Index finger UP):** Draw a continuous line on `imgCanvas` using the selected `drawColor`. Use `xp, yp` logic to ensure smooth lines.
    * **Eraser Mode (All fingers CLOSED / Fist):** Act as an eraser by drawing a thick black line (0,0,0) on the `imgCanvas`.

5.  **Flawless Image Blending:**
    * Convert `imgCanvas` to grayscale.
    * Create a mask using `cv2.threshold(imgGray, 0, 255, cv2.THRESH_BINARY_INV)` (Crucial: Threshold must be 0 so dark colors like Blue don't become transparent).
    * Apply `cv2.bitwise_and` to the main frame and `cv2.bitwise_or` to overlay the canvas perfectly.

6.  **Smart AI Brain: OCR Text vs Math Solver (Regex Fix applied):**
    * When the user presses the 'r' key (Read/Recognize):
    * Extract text from `imgCanvas` using `pytesseract.image_to_string()`.
    * Use the `re` module to check if the text is a Math Equation (contains numbers and operators like +, -, *, /, x).
        * **If Math:** Clean the string (replace 'x' with '*'), evaluate it using a safe `try-except eval()` block, and display on screen: `= [Result]`.
        * **If Normal Text:** Strictly preserve the uppercase/lowercase format (DO NOT use .lower() or .upper()). Display on screen: `Prediction: [Text]`.
    * If the text is empty or invalid, ignore it (prevent "null" errors).

7.  **Controls:**
    * Press 'c' to clear the canvas (`imgCanvas = np.zeros(...)`) and trigger the voice assistant to say "Canvas Cleared".
    * Press 'q' to quit.

Provide the full, clean, executable Python code with proper comments.
