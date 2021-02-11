function loadPLChartData(dataUrl) {
  const parseValue = (v) => {
    v = v.replace(/,/g, ""); // Remove thousand delimiter
    if (v[0] === "(" && v[v.length - 1] === ")")
      v = `-` + v.slice(1, v.length - 1);
    return +v;
  };
  const parseDate = d3.utcParse("%Y/%m/%d");
  const parseMonth = d3.utcParse("%Y-%m");
  const formatMonth = d3.utcFormat("%Y-%m");
  return new Promise((resolve, reject) => {
    Papa.parse(dataUrl, {
      download: true,
      header: true,
      skipEmptyLines: "greedy",
      complete: (results) => {
        const data = results.data;
        // Make sure the date columns are always in ascending order even if they're not in the original csv file
        let dateColumns = results.meta.fields.filter(
          (d) => !["key", ""].includes(d)
        );
        dateColumns.sort((a, b) =>
          d3.ascending(+parseMonth(a), +parseMonth(b))
        );
        data.columns = ["key", ...dateColumns];
        resolve(data);
      },
      error: (error) => reject(error),
      transformHeader: (header, i) => {
        if (i === 0) return "key";
        if (header === "") return "";
        return formatMonth(parseDate(header));
      },
      transform: (value, header) => {
        if (header === "key") return value;
        if (header === "") return "";
        return parseValue(value);
      },
    });
  });
}
