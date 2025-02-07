document.addEventListener("DOMContentLoaded", function () {
    
    let commandText = "tree";
    let typingElement = document.querySelector(".typing");
    let fileStructureElement = document.querySelector(".file-structure");

    let i = 0;

    function typeCommand() {
        if (i < commandText.length) {
            typingElement.innerHTML = commandText.substring(0, i + 1) + '<span class="blinking-cursor">|</span>';
            i++;
            setTimeout(typeCommand, 100); // Adjust speed here
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
│   ├── <a href="#projects" class="terminal-link">project1.md</a><br>
│   ├── <a href="#projects" class="terminal-link">project2.md</a><br>
│   ├── <a href="#projects" class="terminal-link">project3.md</a><br>
└── <a href="#contact" class="terminal-link">contact.txt</a>
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
