# Course Accessibility Reports Dashboard

An intelligent analytics engine for tracking and visualizing course accessibility progress across multiple colleges.

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- npm (usually comes with Node.js)
- A Supabase account (for database and authentication)

### Installation

1. **Clone the repository** (if not already done) or navigate to the project directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Setup Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the Project

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL & Storage)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Processing**: [SheetJS (XLSX)](https://sheetjs.com/) & [PapaParse](https://www.papaparse.com/)

## 📈 Features

- **Global Comparison**: High-level metrics across all colleges.
- **College Drill-down**: Detailed view of course performance within a specific college, including correlation and score shift charts.
- **Course Deep Dive**: Historical progress and specific accessibility metrics for individual courses.
- **Admin Dashboard**: Secure, authenticated interface to manage data sources.
- **Flexible Data Ingestion**: Supports tracking data via live Google Sheet URLs or directly uploading raw `.xlsx` Excel files to cloud storage.
- **Dynamic Time-Series Tracking**: Automatically links historical reports based on course names to generate historical progression trends.
