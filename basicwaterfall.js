<canvas id="waterfall" height="200"></canvas>
<script>
let baseData = [
 { label: 'Revenue', value: 60 }, 
 { label: 'COGS', value: - 50 }, 
 { label: 'Operating Expenses', value: - 40 },
 { label: 'Other Income/Loss', value: + 20 }, 
 { label: 'Tax', value: -10 }
];

const labels = baseData.map(o => o.label).concat('Total');
const data = [];
let total = 0;
for (let i = 0; i < baseData.length; i++) {
  const vStart = total;
  total += baseData[i].value;
  data.push([vStart, total]);  
}
data.push(total);
const backgroundColors = data.map((o, i) => 'rgba(255, 99, 132, ' + (i + (11 - data.length)) * 0.1 + ')');

new Chart('waterfall', {
  type: 'horizontalBar',
  data: {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: backgroundColors,
      barPercentage: 1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    legend: {
      display: false
    },
    tooltips: {
      callbacks: {
        label: (tooltipItem, data) => {
          const v = data.datasets[0].data[tooltipItem.index];
          return Array.isArray(v) ? v[1] - v[0] : v;
        }
      }
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});

</script>
