# 🎮 Midnight Massacre

A thrilling interactive horror story game where you must survive a night being hunted by an unstoppable masked killer known as "The Stalker". Make crucial decisions, find items, and try to survive until dawn.

## 🌟 Features

- 🎭 Rich, atmospheric storytelling with branching narratives
- 🔍 Item collection system that affects your survival options
- 🎵 Immersive audio experience
- 🌙 Dynamic tension system that responds to your choices
- 💀 Multiple possible endings based on your decisions
- 🎨 Beautiful dark UI with haunting animations

## 🚀 Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Create a `.env.local` file in the root directory and add your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key_here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience the horror.

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion
- **State Management**: React Hooks
- **AI Integration**: OpenAI GPT-4
- **Audio**: Custom Web Audio API implementation
- **Font**: Custom horror fonts including CreepsterCaps

## 📁 Project Structure

```
midnight-massacre/
├── app/                  # Next.js app router pages
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── game/           # Game-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── public/             # Static assets
    ├── audio/         # Game sound effects
    └── fonts/         # Custom fonts
```

## 🎮 Game Features

### Story Generation
The game uses GPT-4 to generate dynamic story segments based on player choices, creating a unique experience each time.

### Audio System
Implements a custom audio system for ambient sounds and effects, enhancing the horror atmosphere.

### Game State Management
Tracks various aspects of your progress:
- Item inventory (weapons, keys)
- Tension level
- Encounter count
- Story progression

## 🎨 UI Components

- Custom floating particle system for atmospheric effect
- Responsive game interface with dark theme
- Dynamic loading animations
- Slide-out game status panel

## 📝 Environment Variables

```bash
OPENAI_API_KEY=           # Your OpenAI API key
```

## 🚀 Deployment

The easiest way to deploy Midnight Massacre is using the [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fmidnight-massacre)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Content Warning

This game contains scenes of horror and tension. Player discretion is advised.