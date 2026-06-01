function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

    localStorage.setItem(

        "darkMode",

        document.body.classList.contains("dark-mode")

    );

}

window.onload = () => {

    const darkMode = localStorage.getItem("darkMode");

    if (darkMode === "true") {

        document.body.classList.add("dark-mode");

    }

};
