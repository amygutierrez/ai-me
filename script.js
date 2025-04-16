document.addEventListener("DOMContentLoaded", function () {
    fetch("images/ai-den.json")
        .then(response => response.json())
        .then(data => {
            if (data.images && data.images.length > 0) {
                // Pick a random image from the JSON list
                const randomImage = data.images[Math.floor(Math.random() * data.images.length)];

                // Apply the random image to the pseudo-element via CSS
                const style = document.createElement("style");
                style.innerHTML = `
                    .terminal-body::after {
                        background: url('${randomImage}') no-repeat center;
                        background-size: contain;
                    }
                `;
                document.head.appendChild(style);
            }
        })
        .catch(error => console.error("Error loading images:", error));

    let commandText = "tree";
    let typingElement = document.querySelector(".typing");
    let fileStructureElement = document.querySelector(".file-structure");

    let i = 0;

    function typeCommand() {
        if (i < commandText.length) {
            typingElement.innerHTML = commandText.substring(0, i + 1) + '<span class="blinking-cursor">|</span>';
            i++;
            setTimeout(typeCommand, 175); // Adjust speed here
        } else {
            // Remove cursor after typing
            typingElement.innerHTML = commandText;

            // Show file structure after typing completes
            setTimeout(() => {
                fileStructureElement.style.display = "block";
                fileStructureElement.innerHTML = `
/home/user/<br>
├── <a href="about.html" class="terminal-link">about.txt</a><br>
├── projects/<br>
│   ├── <a href="project1.html" class="terminal-link">smithsonian-hackathon-2024.md</a><br>
│   ├── <a href="#projects" class="terminal-link">project2.md</a><br>
│   ├── <a href="#projects" class="terminal-link">project3.md</a><br>
└── <a href="contact.html" class="terminal-link">contact.txt</a>
                `;

                // Move cursor to a new line after displaying file structure
                let newLine = document.createElement("p");
                newLine.classList.add("command");
                newLine.innerHTML = 'Mac:~ User$ <span class="blinking-cursor">|</span>';
                document.querySelector(".terminal-body").appendChild(newLine);
            }, 500);
        }
    }

    // Start the typing effect
    typeCommand();
});
