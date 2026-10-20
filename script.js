(() => {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const menuToggle = $("#menuToggle");
  const navigation = $("#navigation");

  // Mobile navigation
  function closeMenu() {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  $$("#navigation a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });

  document.addEventListener("click", event => {
    if (
      navigation.classList.contains("open") &&
      !navigation.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  // Image fallback
  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
        <rect width="100%" height="100%" fill="#e4e9ed"/>
        <text x="50%" y="50%" dominant-baseline="middle"
          text-anchor="middle" font-family="Arial" font-size="24"
          fill="#10243a">Image unavailable</text>
      </svg>
    `);

  function setImageFallback(img) {
    img.addEventListener("error", () => {
      if (img.dataset.fallbackApplied) return;

      img.dataset.fallbackApplied = "true";
      img.src = fallbackImage;
    });
  }

  $$("img").forEach(setImageFallback);

  // Company details
  const companyName = config.companyName || "BuildCraft";
  const digits = value => String(value || "").replace(/\D/g, "");

  $("#footerCompany").textContent = companyName;
  document.title = `${companyName} | Construction & Architecture`;

  $("#year").textContent = new Date().getFullYear();

  function configurePhone(element, display, number) {
    if (!number) {
      element.textContent = "Phone number to be configured";
      element.removeAttribute("href");
      return;
    }

    element.textContent = display || number;
    element.href = `tel:${number}`;
  }

  configurePhone(
    $("#phoneLink"),
    config.phoneDisplay,
    config.phoneNumber
  );

  configurePhone(
    $("#footerPhone"),
    config.phoneDisplay,
    config.phoneNumber
  );

  function configureEmail(element) {
    if (!config.email) {
      element.textContent = "Email address to be configured";
      element.removeAttribute("href");
      return;
    }

    element.textContent = config.email;
    element.href = `mailto:${config.email}`;
  }

  configureEmail($("#emailLink"));
  configureEmail($("#footerEmail"));

  $("#addressText").textContent =
    config.address || "Business address to be added";

  function configureWhatsApp(element) {
    const number = digits(config.whatsappNumber);

    if (!number) {
      element.hidden = true;
      element.removeAttribute("href");
      return;
    }

    element.hidden = false;
    element.href = `https://wa.me/${number}`;
  }

  configureWhatsApp($("#whatsappLink"));
  configureWhatsApp($("#footerWhatsApp"));
  configureWhatsApp($("#floatingWhatsApp"));

  // Service cards
  const serviceGrid = $("#serviceGrid");

  (config.services || []).forEach(service => {
    const article = document.createElement("article");
    article.className = "service-card";

    const img = document.createElement("img");
    img.src = service.image;
    img.alt = service.title;
    img.loading = "lazy";
    img.width = 900;
    img.height = 600;
    setImageFallback(img);

    const body = document.createElement("div");
    body.className = "service-body";

    const number = document.createElement("span");
    number.className = "service-number";
    number.textContent = `SERVICE ${service.number}`;

    const title = document.createElement("h3");
    title.textContent = service.title;

    const description = document.createElement("p");
    description.textContent = service.description;

    const link = document.createElement("a");
    link.href = "#contact";
    link.textContent = "Discuss this service ↗";

    body.append(number, title, description, link);
    article.append(img, body);
    serviceGrid.append(article);
  });

  // Projects and category filtering
  const projectGrid = $("#projectGrid");
  const filters = $$("#projectFilters button");
  const projects = config.projects || [];
  const visibleProjects = () => $$(".project-card", projectGrid);

  function renderProjects(filter = "all") {
    projectGrid.replaceChildren();

    projects.forEach((project, index) => {
      if (filter !== "all" && project.category !== filter) return;

      const article = document.createElement("article");
      article.className = "project-card";

      const button = document.createElement("button");
      button.className = "project-image-button";
      button.type = "button";
      button.setAttribute(
        "aria-label",
        `View details: ${project.title}`
      );

      const img = document.createElement("img");
      img.src = project.image;
      img.alt = project.title;
      img.loading = "lazy";
      img.width = 1200;
      img.height = 800;
      setImageFallback(img);

      const category = document.createElement("span");
      category.className = "project-category";
      category.textContent = project.category;

      button.append(img, category);

      const body = document.createElement("div");
      body.className = "project-body";

      const title = document.createElement("h3");
      title.textContent = project.title;

      const location = document.createElement("div");
      location.className = "project-location";
      location.textContent = project.location;

      const description = document.createElement("p");
      description.textContent = project.description;

      const details = document.createElement("a");
      details.href = "#contact";
      details.className = "text-link";
      details.textContent = "Discuss a similar project ↗";

      button.addEventListener("click", () => openProject(index));

      body.append(title, location, description, details);
      article.append(button, body);
      projectGrid.append(article);
    });
  }

  filters.forEach(button => {
    button.addEventListener("click", () => {
      filters.forEach(filter => {
        const active = filter === button;

        filter.classList.toggle("active", active);
        filter.setAttribute("aria-pressed", String(active));
      });

      renderProjects(button.dataset.filter);
    });
  });

  // Accessible project dialog
  const dialog = $("#projectDialog");
  let currentProject = 0;
  let lastTrigger = null;

  function openProject(index) {
    if (!projects.length) return;

    currentProject = index;
    lastTrigger = document.activeElement;
    updateDialog();

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      $("#dialogClose").focus();
    } else {
      window.alert(
        `${projects[index].title}\n\n${projects[index].description}`
      );
    }
  }

  function updateDialog() {
    const project = projects[currentProject];

    $("#dialogTitle").textContent = project.title;
    $("#dialogCategory").textContent = project.category;
    $("#dialogDescription").textContent = project.description;
    $("#dialogLocation").textContent = project.location;

    const image = $("#dialogImage");
    image.src = project.image;
    image.alt = project.title;
    image.dataset.fallbackApplied = "";
    setImageFallback(image);

    const visible = projects.filter(project =>
      $("#projectFilters .active").dataset.filter === "all"
        ? true
        : project.category ===
          $("#projectFilters .active").dataset.filter
    );

    $("#previousProject").disabled = visible.length < 2;
    $("#nextProject").disabled = visible.length < 2;
  }

  function moveProject(direction) {
    const activeFilter =
      $("#projectFilters .active").dataset.filter;

    const filtered = projects
      .map((project, index) => ({ project, index }))
      .filter(({ project }) =>
        activeFilter === "all" ||
        project.category === activeFilter
      );

    if (filtered.length < 2) return;

    let position = filtered.findIndex(
      item => item.index === currentProject
    );

    position = (position + direction + filtered.length) % filtered.length;
    currentProject = filtered[position].index;

    updateDialog();
  }

  $("#previousProject").addEventListener("click", () => moveProject(-1));
  $("#nextProject").addEventListener("click", () => moveProject(1));

  $("#dialogClose").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    if (lastTrigger && lastTrigger.isConnected) {
      lastTrigger.focus();
    }
  });

  renderProjects();

  // Back-to-top button
  const backTop = $("#backTop");

  window.addEventListener("scroll", () => {
    backTop.classList.toggle("visible", window.scrollY > 500);
  }, { passive: true });

  backTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth"
    });
  });

  // Contact form
  const form = $("#contactForm");
  const status = $("#formStatus");

  form.addEventListener("submit", async event => {
    event.preventDefault();
    status.textContent = "";

    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());

    if (!form.elements.consent.checked) {
      status.textContent = "Please agree to the contact notice.";
      return;
    }

    const endpoint = String(config.formEndpoint || "").trim();

    if (endpoint) {
      let url;

      try {
        url = new URL(endpoint);
      } catch {
        status.textContent = "The form endpoint configuration is invalid.";
        return;
      }

      if (url.protocol !== "https:" && url.hostname !== "localhost") {
        status.textContent = "Please configure a secure HTTPS form endpoint.";
        return;
      }

      const submitButton = form.querySelector('[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";

      try {
        const response = await fetch(url.href, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          throw new Error("The form service rejected the request.");
        }

        status.textContent =
          "Your enquiry was accepted by the form service.";

        form.reset();
      } catch {
        status.textContent =
          "The enquiry could not be confirmed. Please contact us by email or WhatsApp.";
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Prepare Enquiry ↗";
      }

      return;
    }

    if (!config.email) {
      status.textContent =
        "Contact email is not configured. Please contact the company directly.";
      return;
    }

    const subject = encodeURIComponent(
      `Construction enquiry from ${data.name}`
    );

    const body = encodeURIComponent(
      `Name: ${data.name}\n` +
      `Phone: ${data.phone}\n` +
      `Email: ${data.email}\n` +
      `Service: ${data.service}\n` +
      `Location: ${data.location}\n` +
      `Budget: ${data.budget || "Not specified"}\n\n` +
      `Project details:\n${data.message}\n`
    );

    status.textContent =
      "Your email app will open with the enquiry prepared. Review and send it there.";

    window.location.href =
      `mailto:${config.email}?subject=${subject}&body=${body}`;
  });

  // Active navigation section
  if ("IntersectionObserver" in window) {
    const sections = $$("main section[id]");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        $$("#navigation a[href^='#']").forEach(link => {
          if (link.getAttribute("href") === `#${entry.target.id}`) {
            link.setAttribute("aria-current", "location");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    }, {
      rootMargin: "-25% 0px -65% 0px"
    });

    sections.forEach(section => observer.observe(section));
  }
})();