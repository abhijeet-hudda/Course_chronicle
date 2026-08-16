
// Plain CSS spinner — replaces @material-tailwind/react's <Spinner>, which
// crashes on React 19 with "Cannot read properties of null (reading
// 'useContext')" unless the whole app is wrapped in its <ThemeProvider>.
// Not worth the dependency for a loading dot.
const Spinner = ({ className = "h-5 w-5" }) => (
  <div
    className={`${className} animate-spin rounded-full border-2 border-white/30 border-t-white`}
    role="status"
    aria-label="Loading"
  />
);

export default Spinner;
