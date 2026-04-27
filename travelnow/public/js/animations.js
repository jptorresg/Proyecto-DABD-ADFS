document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".card");

    const showOnScroll = () => {
        const trigger = window.innerHeight * 0.8;

        elements.forEach(el => {
            const top = el.getBoundingClientRect().top;

            if (top < trigger) {
                el.classList.add("show");
            }
        });
    };

    window.addEventListener("scroll", showOnScroll);
    showOnScroll();
});