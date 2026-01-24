import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.lines import Line2D

def draw_alexnet():
    fig = plt.figure(figsize=(16, 8))
    ax = fig.add_subplot(111, projection='3d')
    ax.set_facecolor('#f8f9fa')

    # Layer definitions: (name, depth, width, height, color, offset_x)
    layers = [
        ("Input", 3, 227, 227, '#bdc3c7', 0),
        ("Conv1", 96, 55, 55, '#3498db', 20),
        ("Pool1", 96, 27, 27, '#f39c12', 40),
        ("Conv2", 256, 27, 27, '#3498db', 60),
        ("Pool2", 256, 13, 13, '#f39c12', 80),
        ("Conv3", 384, 13, 13, '#2980b9', 100),
        ("Conv4", 384, 13, 13, '#2980b9', 120),
        ("Conv5", 256, 13, 13, '#3498db', 140),
        ("Pool3", 256, 6, 6, '#f39c12', 160),
        ("FC1", 4096, 1, 1, '#e74c3c', 185),
        ("FC2", 4096, 1, 1, '#e74c3c', 200),
        ("Output", 1000, 1, 1, '#2ecc71', 215),
    ]

    # Function to draw a 3D box
    def draw_box(ax, ox, oy, oz, dx, dy, dz, color, label):
        # Scale for visualization
        # Depth is along X, Width along Y, Height along Z
        scaled_dx = 5 # Fixed thickness for visualization
        scaled_dy = dy / 5.0
        scaled_dz = dz / 5.0

        # Cube faces
        xx = [ox, ox+scaled_dx, ox+scaled_dx, ox, ox]
        yy = [oy, oy, oy+scaled_dy, oy+scaled_dy, oy]
        zz = [oz, oz, oz, oz, oz]

        # Bottom
        ax.plot_trisurf([ox, ox+scaled_dx, ox+scaled_dx, ox],
                        [oy, oy, oy+scaled_dy, oy+scaled_dy],
                        [oz, oz, oz, oz], color=color, alpha=0.6)
        # Top
        ax.plot_trisurf([ox, ox+scaled_dx, ox+scaled_dx, ox],
                        [oy, oy, oy+scaled_dy, oy+scaled_dy],
                        [oz+scaled_dz, oz+scaled_dz, oz+scaled_dz, oz+scaled_dz], color=color, alpha=0.6)

        # Side faces
        ax.bar3d(ox, oy, oz, scaled_dx, scaled_dy, scaled_dz, color=color, alpha=0.6, edgecolor='k', linewidth=0.5)

        # Labeling
        ax.text(ox, oy + scaled_dy/2, oz + scaled_dz + 2, f"{dx}x{dy}x{dz}", size=8, ha='center')
        ax.text(ox, oy + scaled_dy/2, oz - 15, label, size=9, weight='bold', ha='center')

    curr_x = 0
    for name, d, w, h, color, offset in layers:
        # Center the boxes on Y and Z
        draw_box(ax, offset, -w/10, -h/10, d, w, h, color, name)

    # Style the plot
    ax.set_axis_off()
    ax.view_init(elev=20, azim=-55)
    plt.title("AlexNet Architecture Schematic\nDetailed Spatial Dimensions and Layer Composition", fontsize=16, pad=20)

    # Legend
    legend_elements = [
        Line2D([0], [0], color='#3498db', lw=4, label='Convolutional Layer'),
        Line2D([0], [0], color='#f39c12', lw=4, label='Max Pooling (Overlapping)'),
        Line2D([0], [0], color='#e74c3c', lw=4, label='Fully Connected / Dropout'),
        Line2D([0], [0], color='#2ecc71', lw=4, label='Softmax Output')
    ]
    ax.legend(handles=legend_elements, loc='upper left', bbox_to_anchor=(0, 1))

    plt.tight_layout()
    plt.savefig('alexnet_architecture.png', dpi=300, bbox_inches='tight')
    plt.show()

# Execute the drawing function
draw_alexnet()