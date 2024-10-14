const margin = {top: 20, right: 30, bottom: 50, left: 70}, 
      width = 800 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

const svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("color", "black")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px");

const color = d3.scaleOrdinal()
    .domain(["North America", "Europe", "Asia", "All"])
    .range(["#1f77b4", "#d62728", "#2ca02c", "#000000"]);  // 保留 "All" 选项

let selectedRegions = [];  // 用来存储被选中的区域

d3.csv("top_100_universities.csv").then(function(data) {
    console.log(data); 

    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("fill", "black");

    const y = d3.scaleLinear()
        .domain([0, 80000])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("fill", "black");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("class", "axis-label")
        .text("University Rank");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("class", "axis-label")
        .text("Number of Students");

    function update() {
        svg.selectAll("circle").remove();

        svg.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", d => x(d.rank))
                .attr("cy", d => y(d.stats_number_students.replace(',', '')))
                .attr("r", 5)
                .style("fill", d => color(d.region))
                .style("opacity", d => selectedRegions.includes(d.region) || selectedRegions.length === 0 ? 1 : 0.2)
                .on("mouseover", (event, d) => {
                    tooltip.html(`Name: ${d.name}<br>Rank: ${d.rank}<br>Students: ${d.stats_number_students}<br>Location: ${d.location}`)
                           .style("visibility", "visible");
                })
                .on("mousemove", event => tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px"))
                .on("mouseout", () => tooltip.style("visibility", "hidden"));

        const totalStudents = data
            .filter(d => selectedRegions.includes(d.region) || selectedRegions.length === 0)
            .reduce((acc, d) => acc + parseInt(d.stats_number_students.replace(/,/g, '')), 0);

        // 创建跳动的效果
        d3.select("#total-students")
            .transition()
            .duration(1500)
            .tween("text", function() {
                const that = d3.select(this);
                const i = d3.interpolateNumber(0, totalStudents);  // 从 0 到 totalStudents
                const format = d3.format(",");  // 格式化数字为 1,000,000 样式
                return function(t) {
                    that.text(format(Math.round(i(t))));
                };
            });

        const top10 = data
            .filter(d => selectedRegions.includes(d.region) || selectedRegions.length === 0)
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 10);

        const ul = d3.select("#university-list");
        ul.selectAll("li").remove();

        ul.selectAll("li")
            .data(top10)
            .enter()
            .append("li")
            .html(d => `
                <span class="uni-name">${d.name}</span>
                <span class="wr-rank">WR: ${d.rank}</span>
            `);
    }

    update();

    const legend = svg.selectAll(".legend")
        .data(color.domain())  
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            if (d === "All") {
                selectedRegions = [];
            } else {
                if (selectedRegions.includes(d)) {
                    selectedRegions = selectedRegions.filter(region => region !== d);
                } else {
                    selectedRegions.push(d);
                }
            }
            update();
        });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => color(d))
        .style("opacity", d => selectedRegions.includes(d) || selectedRegions.length === 0 ? 1 : 0.2);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("fill", "black")
        .text(d => d);
});

