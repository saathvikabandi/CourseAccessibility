# Course Accessibility Reports Dashboard

An intelligent analytics engine for tracking and visualizing course accessibility progress across multiple colleges.

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- npm (usually comes with Node.js)

### Installation

1. **Clone the repository** (if not already done) or navigate to the project directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the Project

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## 🛠 Tech Stack

- **Frontend**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Processing**: [SheetJS (XLSX)](https://sheetjs.com/) & [PapaParse](https://www.papaparse.com/)

## 📈 Features

- **Global Comparison**: High-level metrics across all colleges.
- **College Drill-down**: Detailed view of course performance within a specific college.
- **Course Deep Dive**: Historical progress and specific accessibility metrics for individual courses.
- **Dynamic Data Loading**: Connects directly to public Google Sheets workbooks.

## 🚧 Upcoming: Admin Page & Supabase

We are currently integrating **Supabase** to add:
- **Admin Authentication**: Secure login for authorized users.
- **Persistent Storage**: Save report links and configuration in a PostgreSQL database.
- **Historical Trends**: Automated tracking of progress over multiple reporting periods.
