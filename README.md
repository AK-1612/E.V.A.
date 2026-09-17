# E.V.A. — Everpresent Voice Assistant

[![Platform](https://img.shields.io/badge/Platform-PWA%20%7C%20Web%20%7C%20Mobile-0A84FF.svg)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)

> **E.V.A.** (**E**verpresent **V**oice **A**ssistant) is a voice-activated Progressive Web Application (PWA) designed to operate as a charismatic, intelligent personal companion and task automation hub. Built with a mobile-first responsive architecture, real-time speech recognition, human-like voice synthesis, and direct device app integrations.

---

## Key Features

### 1. Conversational Voice Intelligence
- **Real-Time Speech Recognition**: Seamless speech-to-text powered by the Web Speech API with instantaneous transcription.
- **Charismatic Companion Persona**: Powered by Gemini (`gemini-2.5-flash`), responding with natural wit, conversational contractions, and concise spoken cadence.
- **Local Ollama LLM Fallback**: Optional client/LAN routing to a local Ollama instance (e.g., `llama3.2`) for offline-capable, private intelligence.
- **Interactive Audio Visualizer**: Live responsive sound wave animations reflecting voice activity, listening, thinking, and speaking states.

### 2. Natural Speech Synthesis & Accent Customization
- **Regional Dialect Accents**: Choose between **American (US)**, **British (UK)**, **Australian (AU)**, and **Indian (IN)** vocal cadences.
- **Pitch & Speed Calibration**: Real-time slider adjustments for speech rate (0.7x – 1.4x) and pitch.
- **Pronunciation Cleaning**: Automatic normalization of markdown symbols, emojis, and acronyms (`E.V.A.` is pronounced cleanly as *"Eva"*).

### 3. WhatsApp Dispatch, Contacts & Scheduler
- **Integrated Contact Book**: Built-in address book with instant contact creation and one-tap device phonebook import (`navigator.contacts`).
- **Multi-Select Dispatch**: Select multiple contacts simultaneously with organized sequential queue execution.
- **Direct Phone Input**: Custom phone number dialing with international prefix support.
- **Automated Message Scheduler**: Schedule messages with quick presets (*+5m*, *+15m*, *+1h*, *+3h*) or exact date-time picking. Background watcher alerts you and triggers dispatches on schedule.
- **Native Protocol Launch**: Deep-links via `whatsapp://send` to directly open WhatsApp chats with pre-filled drafted text.

### 4. Direct App & Automation Shortcuts
- **Spotify Deep-Linking**: Direct one-tap launcher using `spotify://` protocol to open your native Spotify app.
- **Google Search**: Instant web query launcher with a sanitized search bar ready for voice or text.

### 5. Session History & Transcripts
- **Complete Interaction Log**: View past conversations grouped into clean, inspectable query-and-response cards.
- **Action Filtering**: Filter sessions by action type (WhatsApp, Spotify, Search, General).
- **Export & Share**: One-click JSON data export and clipboard copy for note-taking and records.

### 6. Mobile Progressive Web App (PWA)
- **Standalone Mode**: Runs full-screen without browser URL bars or navigation clutter.
- **Custom App Icon**: Galvanic Mechamorph-inspired neon cybernetic "A" glyph icon.
- **Tactile Haptics**: Vibration feedback on taps, speech triggers, and dispatches.
- **Offline Shell**: Service worker caching and web app manifest for reliable home-screen usage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 with Vite |
| **Language** | TypeScript |
| **Styling & Theme** | Tailwind CSS (iOS Dark Mode Aesthetic) |
| **Icons** | Lucide React |
| **Backend & Proxy** | Express.js (Node.js) |
| **AI SDK** | `@google/genai` (Gemini 2.5 Flash) |
| **Audio & Speech** | Web Speech API (Recognition + Synthesis) |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/) (optional if using local Ollama)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/eva-voice-assistant.git
   cd eva-voice-assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

---

## Mobile Installation (PWA)

E.V.A. is optimized to run as a native-feeling app on mobile devices.

### On iOS (Safari):
1. Open the hosted URL in **Safari**.
2. Tap the **Share** button (the square icon with the upward arrow).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top-right corner.

### On Android (Chrome):
1. Open the hosted URL in **Google Chrome**.
2. Tap the **three-dots menu (⋮)** in the upper right.
3. Select **"Add to Home screen"** or **"Install app"**.
4. Tap **"Install"** to add E.V.A. to your app drawer.

---

## Project Structure

```
├── public/
│   ├── app-logo.jpg      # High-resolution home screen icon
│   ├── icon.svg          # Vector Upgrade "A" cyber icon
│   ├── manifest.json     # PWA Web App Manifest
│   └── sw.js             # Service Worker cache handler
├── src/
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── AssistantView.tsx  # Interactive voice hub & visualizer
│   │   │   ├── ActionsView.tsx    # App automation shortcuts
│   │   │   ├── HistoryView.tsx    # Interaction transcripts & export
│   │   │   └── SettingsView.tsx   # Voice dialect, rate & Ollama settings
│   │   ├── AppLogo.tsx            # Adaptive brand glyph component
│   │   ├── FeatureGuideModal.tsx  # Quick onboarding guide
│   │   ├── SearchModal.tsx        # Google search launcher
│   │   ├── TabBar.tsx             # iOS bottom navigation bar
│   │   └── WhatsAppModal.tsx      # Contact selector, multi-select & scheduler
│   ├── utils/
│   │   ├── apps.ts                # Deep linking (Spotify & WhatsApp)
│   │   ├── contacts.ts            # Contact storage & scheduler storage
│   │   ├── haptics.ts             # Mobile vibration feedback
│   │   ├── llm.ts                 # Client LLM and Ollama handlers
│   │   └── speech.ts              # Web Speech API recognition & TTS synthesis
│   ├── App.tsx                    # Main state machine & orchestrator
│   ├── index.css                  # Tailwind styles
│   └── types.ts                   # TypeScript interfaces
├── server.ts                      # Express server & Gemini API proxy
├── metadata.json                  # AI Studio configuration
├── LICENSE                        # MIT License
└── package.json                   # Project dependencies & scripts
```

---

## License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
