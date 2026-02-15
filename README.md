# Japanese Script Learning

Japanese script learning application for the Trails (Kiseki) series games.

## Features

- CSV file upload for game dialogue data
- Browse and search through scripts
- AI-powered learning material generation (vocabulary, grammar, translations)
- Cached results to avoid redundant API calls

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- DeepSeek API key

### Installation

1. Clone the repository:
```bash
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
│   │   ├── csv/upload/           # CSV upload
│   │   ├── script/               # Script endpoints
│   │   ├── learning/             # Learning material endpoints
│   │   └── health/               # Health check
│   ├── script/                   # Script pages
│   └── learning/                  # Learning material pages
├── components/                   # React components
│   ├── csv-upload/               # CSV upload component
│   ├── script-list/              # Script list component
│   ├── learning-material/        # Learning material component
│   └── ui/                       # UI components
├── lib/                          # Utility libraries
│   ├── db/                       # Prisma client
│   ├── deepseek/                 # DeepSeek API integration
│   └── csv/                      # CSV parsing
├── prisma/                       # Database schema
└── types/                        # TypeScript types
```

## CSV Format

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

## API Endpoints

### POST /api/csv/upload
Upload a CSV file containing game dialogue.

### GET /api/script
List all scripts with pagination and filtering.

Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `gameId` - Filter by game ID
- `scene` - Filter by scene
- `character` - Filter by character name
- `search` - Search in text fields

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

2. **Grammar Breakdown**
   - Grammar point name
   - Form and structure
   - Usage in context
   - Function and nuance
   - Common confusion points

3. **Translation**
   - Literal translation
   - Natural Chinese translation
   - Original text
   - Full kana reading

## Deployment

The application is ready to deploy on Vercel.

1. Push your code to GitHub
2. Import the project in Vercel
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
