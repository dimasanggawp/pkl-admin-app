function FilterPanel({ children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-end gap-3">
      {children}
    </div>
  );
}

export default FilterPanel;
