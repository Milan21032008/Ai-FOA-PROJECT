# **App Name**: Akshar Pehchan AI

## Core Features:

- Live Webcam Drawing Canvas: Utilize webcam feed with MediaPipe for real-time index finger tip tracking to enable virtual drawing of letters on an on-screen canvas.
- Drawing Capture: Allow users to capture their drawn letter as a small image (e.g., via a button or 'Space' key press) once the drawing is complete.
- AI Letter Recognition: Send the captured drawing image to a pre-trained Machine Learning model (e.g., a CNN model trained on EMNIST-like datasets), accessible via an API endpoint, as a tool to predict and identify the drawn English letter.
- Speech Output of Prediction: Convert the predicted letter into spoken word (e.g., pronouncing 'A' as 'Ay') using client-side text-to-speech capabilities, providing immediate auditory feedback to the user.

## Style Guidelines:

- Color Scheme: Light.
- Primary color (for interactive elements, important text): A clean, professional blue, derived from HSL(220, 70%, 55%), converted to #3C71DD. This provides a clear, digital feel conducive to focus.
- Background color (for main canvas and general interface): A very light blue-grey, derived from HSL(220, 15%, 97%), converted to #F6F7F9. This subtle and calming backdrop aids concentration without distraction.
- Accent color (for highlights and actionable feedback): A vibrant, clear blue-green, derived from HSL(190, 70%, 65%), converted to #67CFE4. This analogous accent creates effective contrast for positive feedback or call-to-action elements.
- Main font: 'Inter' (sans-serif) for all text (headlines and body). Its modern, objective, and highly legible characteristics ensure clarity, which is crucial for a learning application focused on letter recognition and clear feedback.
- Use clear, intuitive line-based icons for actions such as 'Start Drawing', 'Capture Drawing', 'Listen to Prediction', and webcam status indicators. The focus will be on minimalist and universally understandable symbols to maintain a clean aesthetic and intuitive user experience.
- Implement a clean and spacious layout with the drawing canvas prominently centered for optimal user interaction. A dedicated control area will house buttons and information panels, keeping the interface uncluttered. The design should be responsive to ensure usability across various screen sizes.
- Incorporate subtle animations for visual feedback: a glowing effect when the index finger tip is successfully tracked, a brief visual transition upon drawing capture, and a gentle ripple effect around the recognized letter when its pronunciation is played to enhance interactivity.