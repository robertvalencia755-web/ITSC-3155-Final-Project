
const header = document.querySelector("[data-site-header]");

if (header) {
    const currentPage = window.location.pathname;

    const links = [
        { label: "Home", href: "/" },
        { label: "Catalogue", href: "/pages/catalogue.html" },
        { label: "About", href: "/pages/about.html" },
        { label: "Profile", href: "/pages/profile.html" },
        { label: "Log In", href: "/pages/auth/logIn_page.html" }
    ];

    const logo = document.createElement("a");
    logo.href = "/";
    logo.className = "site-logo";

    const logoImage = document.createElement("img");
    logoImage.src = "/assets/images/FInal CourseLen Logo Design.png";
    logoImage.alt = "CourseLens Home";

    logo.appendChild(logoImage);

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Main navigation");

    links.forEach(({ label, href }) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;

        if (currentPage === href) {
            link.setAttribute("aria-current", "page");
        }

        nav.appendChild(link);
    });

    header.replaceChildren(logo, nav);
}
