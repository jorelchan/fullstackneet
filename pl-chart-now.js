class PLNow {
  constructor({ el, data, initialDate, title }) {
    this.el = el;
    this.data = data;
    this.dateColumn = initialDate;
    this.title = title;
    this.resizeVis = this.resizeVis.bind(this);
    this.initVis();
  }

  initVis() {
    const vis = this;
    vis.formatValue = d3.format(",");

    vis.container = d3
      .select(vis.el)
      .append("div")
      .attr("class", "pl-chart pl-chart-now");
    vis.title = vis.container
      .append("div")
      .attr("class", "chart-title")
      .text(vis.title);
    vis.chart = vis.container.append("div").attr("class", "chart-container");
    vis.svg = vis.chart
      .append("svg")
      .style("display", "block")
      .on("click", () => {});

    // Constant data
    vis.displayData = [
      { key: "Revenue", isTotal: false },
      { key: "COGS", isTotal: false },
      { key: "Gross Profit", isTotal: true },
      { key: "SGA", isTotal: false },
      { key: "Operating Profit", isTotal: true },
      { key: "Other Income", isTotal: false },
      { key: "Other Expense", isTotal: false },
      { key: "Adjusted Operating Profit", isTotal: true },
      { key: "Exceptional Income", isTotal: false },
      { key: "Exceptional Expense", isTotal: false },
      { key: "Pre-Tax Profit", isTotal: true },
      { key: "Taxes", isTotal: false },
      { key: "Tax Adjustments", isTotal: false },
      { key: "Net Profit", isTotal: true },
    ];

    // Dimension
    vis.maxKeyWidth = vis.getMaxTextWidth(vis.displayData.map((d) => d.key));
    vis.padding = 8;
    vis.margin = {
      top: 8,
      right: 0,
      bottom: 32,
      left: vis.maxKeyWidth + vis.padding,
    };
    vis.barHeight = 24;
    vis.barPadding = 16;
    vis.height =
      vis.margin.top +
      vis.margin.bottom +
      (vis.barHeight + vis.barPadding) * vis.displayData.length;

    // Scale
    vis.x = d3.scaleLinear();
    vis.y = d3
      .scalePoint()
      .domain(vis.displayData.map((d) => d.key))
      .range([vis.margin.top, vis.height - vis.margin.bottom])
      .padding(0.5);

    // Chart components
    vis.gx = vis.svg.append("g").attr("class", "axis axis--x");
    vis.zeroLine = vis.svg.append("line").attr("class", "zero-line");
    vis.g = vis.svg.append("g").attr("class", "bars");

    // Tooltip
    vis.tooltip = ((container) => {
      const tooltip = container.append("div").attr("class", "chart-tooltip");
      function show(event, d) {
        const content = /*html*/ `
          <div class="chart-tooltip__title">${d.key}</div>          
          <div class="chart-tooltip__body">
            <div class="chart-tooltip__item">
              <div class="chart-tooltip__swatch">
                <svg width="12" height="12" style="display: block;">
                  <rect
                    width="12"
                    height="12"
                    fill="#fff"
                  ></rect>
                  <rect
                    x="0.5"
                    y="0.5"
                    width="11"
                    height="11"
                    fill="${d.color}"
                    fill-opacity="0.5"
                    stroke="${d.color}"
                  ></rect>
                </svg>
              </div>
              <div class="chart-tooltip__value">${vis.formatValue(
                d.value
              )}</div>
            </div>
          </div>          
        `;
        const isRight = d.value >= 0;
        tooltip
          .html(content)
          .classed("left", !isRight)
          .classed("right", isRight);
        const box = tooltip.node().getBoundingClientRect();
        const x = isRight ? vis.x(d.end) - box.width - 6 : vis.x(d.end) + 6;
        const y = vis.y(d.key) - box.height / 2;
        tooltip
          .style("transform", `translate(${x}px,${y}px)`)
          .classed("show", true);
      }
      function hide() {
        tooltip.classed("show", false);
      }
      return {
        show,
        hide,
      };
    })(vis.chart);

    vis.resizeVis();
    window.addEventListener("resize", vis.resizeVis);
    vis.wrangleData();
  }

  wrangleData() {
    const vis = this;
    const valueLookup = new Map(
      vis.data.map((d) => [d.key, d[vis.dateColumn]])
    );

    let total = 0;
    vis.displayData.forEach((d, i, n) => {
      if (!d.isTotal) {
        d.value = valueLookup.get(d.key) || 0;
        d.color =
          d.value > 0
            ? "var(--color-series-blue)"
            : d.value < 0
            ? "var(--color-series-red)"
            : "var(--color-axis-dark)";
        d.start = total;
        total += d.value;
        d.end = total;
      } else {
        d.color =
          i === n.length - 1
            ? "var(--color-series-dark-grey)"
            : "var(--color-series-grey)";
        d.start = 0;
        d.value = total;
        d.end = total;
      }
    });

    vis.maxPositiveValueWidth = vis.getMaxTextWidth(
      vis.displayData
        .filter((d) => d.value >= 0 && d.end >= 0)
        .map((d) => d.value)
    );
    vis.maxNegativeValueWidth = vis.getMaxTextWidth(
      vis.displayData
        .filter((d) => d.value < 0 && d.end < 0)
        .map((d) => d.value)
    );

    vis.x
      .domain([
        Math.min(
          0,
          d3.min(vis.displayData, (d) => d.end)
        ),
        Math.max(
          0,
          d3.max(vis.displayData, (d) => d.end)
        ),
      ])
      .range([
        vis.margin.left + vis.padding + vis.maxNegativeValueWidth,
        vis.width - vis.margin.right - vis.padding - vis.maxPositiveValueWidth,
      ]);

    vis.updateVis(true);
  }

  resizeVis(event) {
    const vis = this;
    vis.width = vis.container.node().clientWidth;
    vis.svg.attr("viewBox", [0, 0, vis.width, vis.height]);
    vis.x.range([
      vis.margin.left + vis.padding + vis.maxNegativeValueWidth,
      vis.width - vis.margin.right - vis.padding - vis.maxPositiveValueWidth,
    ]);
    if (event) {
      vis.updateVis();
    }
  }

  updateVis(withTransition) {
    const vis = this;
    vis.gx
      .attr("transform", `translate(-0.5,${vis.height - vis.margin.bottom})`)
      .call(
        d3
          .axisBottom(vis.x)
          .tickSize(8)
          .tickPadding(4)
          .ticks((vis.width - vis.margin.left - vis.margin.right) / 100)
      )
      .attr("font-size", null)
      .attr("font-family", null)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove());
    vis.zeroLine
      .attr(
        "transform",
        `translate(${vis.x(0)},${vis.height - vis.margin.bottom})`
      )
      .attr("y1", -vis.height + vis.margin.top + vis.margin.bottom)
      .attr("y2", 8)
      .attr("stroke", "var(--color-axis-dark)");
    vis.gRow = vis.g
      .selectAll(".bar")
      .data(vis.displayData, (d) => d.key)
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "bar")
          .call((g) =>
            g
              .append("text")
              .attr("class", "bar-key")
              .attr("dy", "0.32em")
              .attr("font-weight", (d) => (d.isTotal ? "bold" : "normal"))
              .text((d) => d.key)
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "bar-value")
              .attr("x", (d) =>
                d.value >= 0 ? vis.x(0) + vis.padding : vis.x(0) - vis.padding
              )
              .attr("dy", "0.32em")
              .attr("font-weight", (d) => (d.isTotal ? "bold" : "normal"))
              .attr("text-anchor", (d) => (d.value >= 0 ? "start" : "end"))
              .text((d) => vis.formatValue(d.value))
          )
          .call((g) =>
            g
              .append("line")
              .attr("class", "bar-total-line")
              .attr("stroke", (d) =>
                d.isTotal ? "var(--color-axis-dark)" : "transparent"
              )
              .attr("x2", vis.width - vis.margin.right)
              .attr("y1", -vis.barHeight / 2 - vis.barPadding / 2)
              .attr("y2", -vis.barHeight / 2 - vis.barPadding / 2)
          )
          .call((g) =>
            g
              .append("line")
              .attr("class", "bar-end-line")
              .attr("stroke", "var(--color-axis-dark)")
              .attr("x1", (d) => vis.x(0))
              .attr("x2", (d) => vis.x(0))
              .attr("y1", (d, i, n) =>
                i === n.length - 1 ? 0 : vis.barHeight / 2
              )
              .attr("y2", (d, i, n) =>
                i === n.length - 1 ? 0 : vis.barHeight / 2 + vis.barPadding
              )
          )
          .call((g) =>
            g
              .append("rect")
              .attr("class", "bar-rect")
              .attr("fill-opacity", 0.5)
              .attr("x", (d) => vis.x(0))
              .attr("width", 0)
              .attr("y", -vis.barHeight / 2)
              .attr("height", vis.barHeight)
              .on("mouseover", vis.tooltip.show)
              .on("mouseout", vis.tooltip.hide)
          )
      )
      .attr("transform", (d) => `translate(0,${vis.y(d.key)})`);
    const gRow = withTransition
      ? vis.gRow.transition().duration(500)
      : vis.gRow;
    gRow
      .call((g) =>
        g
          .select(".bar-value")
          .attr("x", (d) =>
            d.value >= 0
              ? vis.x(d.end) + vis.padding
              : vis.x(d.end) - vis.padding
          )
          .attr("text-anchor", (d) => (d.value >= 0 ? "start" : "end"))
          .text((d) => vis.formatValue(d.value))
      )
      .call((g) =>
        g.select(".bar-total-line").attr("x2", vis.width - vis.margin.right)
      )
      .call((g) =>
        g
          .select(".bar-end-line")
          .attr("x1", (d) => vis.x(d.end))
          .attr("x2", (d) => vis.x(d.end))
      )
      .call((g) =>
        g
          .select(".bar-rect")
          .attr("fill", (d) => d.color)
          .attr("stroke", (d) => d.color)
          .attr("x", (d) => Math.min(vis.x(d.start), vis.x(d.end)))
          .attr("width", (d) => Math.abs(vis.x(d.start) - vis.x(d.end)))
      );
  }

  getMaxTextWidth(texts) {
    const vis = this;
    const g = vis.svg.append("g").attr("font-weight", "bold");
    g.selectAll("text")
      .data(texts)
      .join("text")
      .text((d) => d);
    const maxWidth = Math.ceil(g.node().getBBox().width);
    g.remove();
    return maxWidth;
  }

  onDateChange(date) {
    const vis = this;
    vis.dateColumn = date;
    vis.wrangleData();
  }

  destroy() {
    const vis = this;
    window.removeEventListener("resize", vis.resizeVis);
    d3.select(vis.el).selectAll("*").remove();
  }
}
