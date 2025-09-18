// Organizational structure data
const organizationalStructureData = {
  title: "CEO / President",
  subordinates: [
    {
      title: "Managing Director",
      subordinates: [
        {
          title: "General Manager",
          subordinates: [
            {
              title: "Technical Manager",
              subordinates: [
                {
                  title: "Mechanical In-Charge",
                  subordinates: [
                    {
                      title: "QA/QC",
                      subordinates: [
                        {
                          title: "Mechanical Foreman"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              title: "Projects Director",
              subordinates: [
                {
                  title: "Electrical In-charge",
                  subordinates: [
                    {
                      title: "Safety Officer",
                      subordinates: [
                        {
                          title: "Permit Receiver"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              title: "Project Coordinator",
              subordinates: [
                {
                  title: "Assistant Mechanical In Charge",
                  subordinates: [
                    {
                      title: "Document Control",
                      subordinates: [
                        {
                          title: "Electrical Foreman"
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              title: "Admin Manager"
            }
          ]
        }
      ]
    }
  ]
};

// Set the dimensions and margins of the diagram
// Swapped width and height here for vertical layout
const margin = { top: 90, right: 100, bottom: 90, left: 100 },
      width = 800 - margin.left - margin.right, // Adjusted width
      height = 1200 - margin.top - margin.bottom; // Adjusted height

// Append the svg object to the body of the page
const svg = d3.select("#org-chart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

let i = 0,
    duration = 750,
    root;

// Declares a tree layout and assigns the size
// tree.size expects [height, width] for vertical layout
const treemap = d3.tree().size([width, height]); // Swapped dimensions for vertical

// Assigns parent, children, height, depth
root = d3.hierarchy(organizationalStructureData, d => d.subordinates);
root.x0 = width / 2; // Initial x position (top of the chart)
root.y0 = 0; // Initial y position (left side, now top for vertical)

// Collapse after the second level
// root.children.forEach(collapse); // Uncomment to collapse all but root

update(root);

// Collapse the node and all it's children
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function update(source) {
  // Assigns the x and y position for the nodes
  const treeData = treemap(root);

  // Compute the new tree layout.
  const nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  // d.y becomes vertical spacing, d.x becomes horizontal position
  nodes.forEach(d => d.y = d.depth * 180); // Adjust this value to control vertical spacing

  // ****************** Nodes section ******************

  // Update the nodes...
  const node = svg.selectAll('g.node')
    .data(nodes, d => d.id || (d.id = ++i));

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node.enter().append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${source.x0},${source.y0})`) // Swapped x0, y0
    .on('click', click);

  // Add Rect for the nodes
  nodeEnter.append('rect')
    .attr('class', 'nodeRect')
    .attr('width', 120) // Fixed width for rectangles
    .attr('height', 30)  // Fixed height for rectangles
    .attr('x', -60)      // Center the rectangle horizontally
    .attr('y', -15);     // Center the rectangle vertically

  // Add labels for the nodes
  nodeEnter.append('text')
    .attr('dy', '.35em')
    .attr('x', 0) // Center text horizontally
    .attr('y', 0) // Center text vertically
    .attr('text-anchor', 'middle')
    .text(d => d.data.title);

  // UPDATE
  const nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr('transform', d => `translate(${d.x},${d.y})`); // Swapped d.x, d.y

  // Update the node attributes and style
  nodeUpdate.select('rect.nodeRect')
    .attr('width', 120)
    .attr('height', 30)
    .attr('x', -60)
    .attr('y', -15)
    .attr('fill', d => d._children ? "#a0cbed" : "#e6f2ff") // Color collapsed nodes differently
    .attr('stroke', 'steelblue')
    .attr('stroke-width', '1px');

  nodeUpdate.select('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .attr('fill', '#333');

  // Remove any exiting nodes
  const nodeExit = node.exit().transition()
    .duration(duration)
    .attr('transform', d => `translate(${source.x},${source.y})`) // Swapped source.x, source.y
    .remove();

  // On exit reduce the opacity of text labels
  nodeExit.select('rect').remove();
  nodeExit.select('text')
    .attr('fill-opacity', 1e-6);

  // ****************** Links section ******************

  // Update the links...
  const link = svg.selectAll('path.link')
    .data(links, d => d.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link.enter().insert('path', "g")
    .attr("class", "link")
    .attr('d', d => {
      const o = { x: source.x0, y: source.y0 }; // Swapped x0, y0
      return diagonal(o, o);
    });

  // UPDATE
  const linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
    .duration(duration)
    .attr('d', d => diagonal(d, d.parent));

  // Remove any exiting links
  link.exit().transition()
    .duration(duration)
    .attr('d', d => {
      const o = { x: source.x, y: source.y }; // Swapped x, y
      return diagonal(o, o);
    })
    .remove();

  // Store the old positions for transition.
  nodes.forEach(d => {
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {
    // Swapped coordinates for vertical path
    return `M ${s.x} ${s.y}
            C ${s.x} ${(s.y + d.y) / 2},
              ${d.x} ${(s.y + d.y) / 2},
              ${d.x} ${d.y}`;
  }

  // Toggle children on click.
  function click(event, d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
}