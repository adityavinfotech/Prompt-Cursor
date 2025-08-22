# AI IDE Prompt Agent

A Next.js application that transforms plain-text feature requirements into structured, IDE-specific prompts using Google's Gemini AI. The application analyzes requirements, generates clarifying questions, and produces optimized prompts for different AI-powered development environments.

## Features

### 🧠 Intelligent Requirement Analysis
- **Automated Analysis**: Extract goals, constraints, dependencies, edge cases, and acceptance criteria from natural language requirements
- **Smart Question Generation**: Generate contextual clarifying questions to resolve ambiguities
- **Assumption Management**: Identify implicit assumptions with confidence scores
- **Interactive Refinement**: Update analysis based on user feedback

### 🚀 Multi-IDE Prompt Generation
Generate optimized prompts for popular AI development tools:
- **Cursor**: Detailed implementation plans with step-by-step guidance
- **GitHub Copilot**: Concise, code-generation focused prompts
- **Warp Terminal**: Command-line and workflow-focused instructions
- **Windsurf**: Comprehensive architecture and design-focused prompts

### 💡 User Experience
- **Real-time Validation**: Input validation with character limits and feedback
- **Session Management**: Save and restore previous analyses
- **Error Handling**: Comprehensive error messages and retry mechanisms
- **Dark/Light Theme**: Responsive design with theme switching
- **Export Functionality**: Download prompts as JSON files

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript with strict configuration
- **Styling**: Tailwind CSS 4.1.9 with custom design tokens
- **UI Components**: Shadcn/ui with Radix UI primitives
- **State Management**: React useState
- **Theme**: next-themes for dark/light mode switching

### Backend & AI
- **LLM Provider**: Google Gemini AI (gemini-1.5-flash model)
- **API Routes**: Next.js API routes for server-side processing
- **Validation**: Zod for request/response validation
- **Rate Limiting**: Built-in rate limiting (10 requests/minute)
- **Error Handling**: Comprehensive error boundaries and user feedback

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Google AI Studio account and API key

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd ai-ide-prompt-agent
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Next.js Configuration (optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting your Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and paste it into your `.env.local` file

### 3. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## Usage Guide

### 1. Input Requirements
- Enter your feature requirement in the text area (10-2000 characters)
- Be specific and detailed for better analysis results
- Click "Analyze Requirement" to process your input

### 2. Review Analysis
The analysis will include:
- **Goals**: Main objectives and desired outcomes
- **Constraints**: Technical and business limitations
- **Dependencies**: Required systems, libraries, or prerequisites
- **Edge Cases**: Potential failure scenarios
- **Acceptance Criteria**: Testable success conditions
- **Questions**: Clarifying questions with priority levels
- **Assumptions**: Implicit assumptions with confidence scores

### 3. Answer Questions (Optional)
- Review and answer any clarifying questions
- Questions are prioritized as "critical", "important", or "nice-to-have"
- Your answers will refine the final prompts

### 4. Accept/Reject Assumptions
- Review generated assumptions about your requirement
- Toggle assumptions on/off based on your needs
- Confidence scores help you evaluate assumption reliability

### 5. Generate IDE Prompts
- Click "Generate IDE Prompts" to create tailored prompts
- Switch between tabs to view different IDE-specific formats
- Copy prompts directly to your clipboard
- Export all prompts as a JSON file

### 6. Session Management
- View previous sessions in the History tab
- Load previous analyses to build upon or reference
- Sessions include timestamps and completion status

## API Endpoints

### POST /api/analyze
Analyzes a feature requirement and extracts structured information.

**Request:**
```json
{
  "requirement": "Add OAuth login with Google and GitHub..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": ["..."],
    "constraints": ["..."],
    "dependencies": ["..."],
    "edgeCases": ["..."],
    "acceptanceCriteria": ["..."],
    "questions": [{"id": "q1", "text": "...", "priority": "critical"}],
    "assumptions": [{"id": "a1", "text": "...", "confidence": 0.8, "accepted": true}]
  }
}
```

### POST /api/prompts
Generates IDE-specific prompts based on analysis results.

**Request:**
```json
{
  "requirement": "...",
  "analysis": {...},
  "answeredQuestions": [...],
  "acceptedAssumptions": [...]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cursor": "# Implementation Guide...",
    "copilot": "Create a system that...",
    "warp": "## Terminal Workflow...",
    "windsurf": "### Architecture Overview..."
  }
}
```

### POST /api/questions
Generates additional clarifying questions (optional endpoint for future enhancements).

## Rate Limiting & Error Handling

### Rate Limits
- **Default Limit**: 10 requests per minute per client
- **Configurable**: Modify limits in `lib/gemini.ts`
- **Response**: 429 status code when limit exceeded

### Error Types
- **Validation Errors**: Invalid input data (400)
- **Rate Limiting**: Too many requests (429) 
- **API Errors**: Gemini API issues (401, 403, 500)
- **Network Errors**: Connection problems
- **Parsing Errors**: Invalid LLM responses

### Error Recovery
- Automatic retry suggestions for transient errors
- Clear error messages with actionable guidance
- Graceful degradation when services are unavailable

## Development

### Project Structure
```
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── analyze/           # Requirement analysis endpoint
│   │   ├── prompts/           # Prompt generation endpoint
│   │   └── questions/         # Additional questions endpoint
│   ├── globals.css           # Global styles and theme variables
│   ├── layout.tsx            # Root layout with providers
│   └── page.tsx              # Main application component
├── components/
│   ├── ui/                   # Shadcn/ui components
│   ├── analysis-panel.tsx    # Analysis results display
│   ├── header.tsx            # Application header
│   ├── history-panel.tsx     # Session history management
│   ├── prompts-panel.tsx     # Generated prompts display
│   └── requirement-input.tsx # Requirement input form
├── lib/
│   ├── analysis-service.ts   # LLM analysis logic
│   ├── env.ts               # Environment validation
│   ├── gemini.ts            # Gemini API service
│   ├── prompt-service.ts    # IDE prompt generation
│   └── utils.ts             # Utility functions
└── hooks/
    ├── use-mobile.ts        # Mobile detection
    └── use-toast.ts         # Toast notifications
```

### Key Components

#### GeminiService (`lib/gemini.ts`)
- Manages Gemini API connections and configurations
- Handles authentication, rate limiting, and error handling
- Provides structured response parsing

#### AnalysisService (`lib/analysis-service.ts`)
- Orchestrates requirement analysis workflow
- Generates clarifying questions and assumptions
- Refines analysis based on user feedback

#### PromptService (`lib/prompt-service.ts`)
- Creates IDE-specific prompts from analysis results
- Tailors content for different development environments
- Incorporates user answers and accepted assumptions

### Building for Production
```bash
npm run build
npm start
```

### Linting and Formatting
```bash
npm run lint
```

## Configuration

### Gemini API Settings
Modify generation parameters in `lib/gemini.ts`:
```typescript
generationConfig: {
  temperature: 0.7,    // Creativity (0.0-1.0)
  topP: 0.8,          // Nucleus sampling
  topK: 40,           // Top-k sampling
  maxOutputTokens: 8192, // Response length limit
}
```

### Rate Limiting
Adjust rate limits in `lib/gemini.ts`:
```typescript
export const rateLimiter = new RateLimiter(15, 60000) // 15 requests per minute
```

### UI Theme
Customize colors and design tokens in `app/globals.css` and `components.json`.

## Deployment

### Environment Variables
Ensure production environment includes:
```env
GEMINI_API_KEY=your_production_api_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Deployment Platforms
- **Vercel**: Automatic deployment with Next.js optimization
- **Netlify**: Static site generation with API functions
- **Railway/Render**: Full-stack deployment with environment management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add error handling for all API interactions
- Update documentation for new features
- Test with various requirement types and edge cases

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation and FAQ
- Review error messages and logs for troubleshooting

---

**Built with ❤️ using Next.js, TypeScript, Tailwind CSS, and Google Gemini AI**
