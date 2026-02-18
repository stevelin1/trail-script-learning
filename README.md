# Japanese Script Learning

Japanese script learning application for Trails (Kiseki) series games.

## Features

- **CSV File Upload** - Upload CSV files containing game dialogue data
- **Markdown File Upload** - Upload MD files with pre-parsed learning materials (desktop only)
- **Browse & Search** - Browse through scripts with advanced search and filtering
- **Learn Status Tracking** - Filter by all/learned/unlearned scripts with progress badges
- **File-Level Statistics** - View total and learned counts per file
- **AI-Powered Learning Materials** - Generate vocabulary, grammar, and translations via DeepSeek API
- **Cached Results** - Avoid redundant API calls with intelligent caching
- **Text-to-Speech** - Listen to Japanese text with female voice (browser-based)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- DeepSeek API key (optional, for AI generation)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd japanese-script-learning
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/japanese_script_learning"
DEEPSEEK_API_KEY="sk-your-key-here"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
japanese-script-learning/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── csv/upload/            # CSV upload endpoint
│   │   ├── md/upload/             # Markdown upload endpoint
│   │   ├── script/                # Script list/get endpoints
│   │   ├── files/                 # Files statistics endpoint
│   │   ├── learning/              # Learning material endpoints
│   │   └── health/                # Health check
│   ├── script/                    # Script list page
│   └── learning/                   # Learning material pages
├── components/                   # React components
│   ├── csv-upload/                # CSV upload component (desktop only)
│   ├── md-upload/                  # Markdown upload component (desktop only)
│   ├── tts-button/                 # Text-to-speech button component
│   ├── script-list/               # Script list component
│   ├── learning-material/           # Learning material display component
│   └── ui/                        # UI components (Card, Button, etc.)
├── lib/                          # Utility libraries
│   ├── db/                        # Prisma client
│   ├── deepseek/                  # DeepSeek API integration
│   ├── csv/                       # CSV parsing
│   └── md-parser/                  # Markdown learning material parser
├── prisma/                       # Database schema
└── types/                        # TypeScript types
```

## File Uploads

### CSV Format

The CSV file should contain the following columns:

- `gameId` - Game ID (number)
- `scene` - Scene ID (string)
- `row` - Row number within scene (number)
- `jpnChrName` - Japanese character name
- `jpnSearchText` - Japanese text without HTML
- `engChrName` - English character name
- `engSearchText` - English text without HTML

Example:
```csv
gameId,scene,row,jpnChrName,jpnSearchText,engChrName,engSearchText
8,c0820,15,1,ルース,俺が仕入れた『導力孫の手』の 売れ行きが悪いんだ……,Roose,The orbal back scratchers I bought in bulk haven't been selling well.
```

### Markdown Format (Learning Materials)

Upload MD files containing pre-parsed learning materials. The parser supports:

- Sentence blocks separated by `### 句 N` headers
- Vocabulary tables with word, reading, pitch, part of speech, meaning, and context
- Grammar sections with form, usage, function, and notes
- Translation sections with literal, natural, original, and kana readings

The MD file name must match the CSV file name (excluding extension) for scripts to be matched.

## API Endpoints

### POST /api/csv/upload
Upload a CSV file containing game dialogue.

### POST /api/md/upload
Upload a Markdown file containing learning materials. Matches scripts by filename and Japanese text.

### GET /api/script
List all scripts with pagination and filtering.

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `fileName` - Filter by file name
- `search` - Search in text fields
- `hasLearningMaterial` - Filter by learn status ('true' or 'false')

### GET /api/files
Get list of all files with statistics (total and learned counts).

### GET /api/script/[id]
Get a specific script by ID.

### POST /api/learning/generate
Generate learning material for a script. Returns cached result if available.

Body:
```json
{
  "scriptId": "string"
}
```

### GET /api/learning/[id]
Get learning material by ID.

### GET /api/health
Health check endpoint.

## Learning Material Format

Generated learning materials include:

1. **Vocabulary Analysis**
   - Word/Phrase
   - Reading with pitch accent
   - Part of speech
   - Meaning
   - Context explanation
   - Verb forms (for verbs)

2. **Grammar Breakdown**
   - Grammar point name
   - Form and structure
   - Usage in context
   - Function and nuance
   - Common confusion points
   - Speech notes (口语缩略)

3. **Translation**
   - Literal translation
   - Natural Chinese translation
   - Original text
   - Full kana reading

## Features in Detail

### Learn Status Tracking
- Click on a file's "learned" badge to filter and show only learned scripts
- Filter options: All, Learned (学習済み), Unlearned (未学習)
- Status is preserved across page navigation

### Text-to-Speech
- Uses browser's built-in Web Speech API
- No API key required
- Defaults to female Japanese voice when available
- Play/Pause/Stop controls
- Available on all Japanese text (dialogue, original, kana readings)

### Responsive Design
- Upload components hidden on mobile (desktop only)
- Script list and learning materials fully responsive
- Table/card layouts adapt to screen size

## Deployment

The application is ready to deploy on Vercel.

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `DEEPSEEK_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
4. Deploy

For production database, consider using a managed PostgreSQL service like:
- Vercel Postgres
- Supabase
- Neon
- Railway

## License

MIT
