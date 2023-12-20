import "./TitleBar.css";

export function TitleBar({ type, uYear, uSetCase, uSetYear, uCase }) {
  // Get the current year for the selection menu
  const today = new Date();
  const thisYear = today.getFullYear();
  const yearlist = [];
  for (let i = 2000; i <= thisYear; i++) {
    yearlist.push(i);
  }

  const changeYear = (e) => {
    uSetCase({ ...uCase, fetched: false });
    uSetYear(e.target.value);
  };

  return (
    <div id="title-bar">
      <select value={uYear} onChange={changeYear}>
        {yearlist.map((y, index) => {
          return (
            <option key={index} value={y}>
              {y}
            </option>
          );
        })}
      </select>
      <h1>{type}</h1>
    </div>
  );
}