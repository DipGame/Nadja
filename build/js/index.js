document.addEventListener("DOMContentLoaded", function () {
  const main = document.querySelector("main");
  const footer = document.querySelector("footer");

  // Начало скрипта: общие helper-функции
  var headerRoot = document.querySelector(".header");
  var headerHiddenContainer = document.querySelector(
    ".header__hidden-container",
  );

  var headerGetSafeEventTarget = function (event) {
    return event && event.target instanceof Element ? event.target : null;
  };

  var headerIsMobileMenuViewport = function () {
    return window.innerWidth <= 1280;
  };

  var headerGetMenuLevelByClass = function (headerElement, headerClassPrefix) {
    if (!headerElement) {
      return null;
    }

    for (var i = 0; i < headerElement.classList.length; i += 1) {
      var headerClassName = headerElement.classList[i];
      if (headerClassName.indexOf(headerClassPrefix) !== 0) {
        continue;
      }

      var headerLevelNumber = Number(
        headerClassName.replace(headerClassPrefix, ""),
      );
      if (!Number.isNaN(headerLevelNumber)) {
        return headerLevelNumber;
      }
    }

    return null;
  };

  var headerHasNavigableHref = function (headerAnchorElement) {
    if (!headerAnchorElement) {
      return false;
    }

    var headerAnchorHref = headerAnchorElement.getAttribute("href");
    return Boolean(headerAnchorHref && headerAnchorHref.trim());
  };

  var headerOpenHref = function (headerHref, headerOpenInNewTab) {
    if (!headerHref || headerHref === "#") {
      return;
    }

    if (headerOpenInNewTab) {
      window.open(headerHref, "_blank", "noopener");
      return;
    }

    window.location.href = headerHref;
  };
  // Конец скрипта: общие helper-функции

  // Начало скрипта: фиксированный хедер
  if (headerRoot) {
    const headerBot = headerRoot;

    if (!headerBot || !main) return;

    main.style.paddingTop = `${headerBot.offsetHeight}px`;

    // Сохраняем исходную позицию элемента
    let originalHeaderTop = headerBot.offsetTop;

    function handleScroll() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // Если прокрутили до верха страницы
      if (scrollTop === 0) {
        headerBot.classList.remove("fixed"); // Удаляем класс fixed
        // main.style.paddingTop = '0'; // Сбрасываем padding-top
      }
      // Если прокрутили ниже исходной позиции header
      else if (scrollTop >= originalHeaderTop) {
        headerBot.classList.add("fixed"); // Добавляем класс fixed
        // main.style.paddingTop = `${headerBot.offsetHeight}px`; // Устанавливаем padding-top
      }
    }

    // Обработчик изменения размера окна
    function handleResize() {
      // Пересчитываем исходную позицию при изменении размера окна
      originalHeaderTop = headerBot.offsetTop;
      handleScroll(); // Вызываем handleScroll для корректировки состояния
    }

    // Добавляем обработчики событий
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Убедимся, что скрипт выполняется после полной загрузки DOM
    document.addEventListener("DOMContentLoaded", () => {
      // Пересчитываем originalHeaderTop после загрузки DOM
      originalHeaderTop = headerBot.offsetTop;
      handleScroll(); // Вызываем handleScroll для корректировки состояния
    });
  }
  //Конец скрипта: фиксированный хедер

  // Начало скрипта: якорная навигация data-anchors
  function initStickyAnchors() {
    const anchorsSections = document.querySelectorAll("[data-anchors]");
    if (!anchorsSections.length) {
      return;
    }

    const ANCHOR_SCROLL_EXTRA_OFFSET = 30;
    const BODY_ANCHORS_FIXED_CLASS = "has-fixed-anchors";

    const getHeaderHeight = () =>
      headerRoot ? Math.round(headerRoot.getBoundingClientRect().height) : 0;

    const getAnchorsHeight = () => {
      const anchors = document.querySelector("[data-anchors]");
      return anchors ? Math.round(anchors.getBoundingClientRect().height) : 0;
    };

    anchorsSections.forEach((anchorsSection) => {
      const links = Array.from(
        anchorsSection.querySelectorAll('a[href^="#"]'),
      ).filter((link) => link.getAttribute("href") !== "#");
      if (!links.length) {
        return;
      }

      const targets = links.map((link) => {
        const href = link.getAttribute("href") || "";
        const id = href.slice(1);
        return id ? document.getElementById(id) : null;
      });

      const scrollToAnchorTarget = (target) => {
        if (!target) return;
        const headerHeight = getHeaderHeight();
        const anchorsHeight = getAnchorsHeight();
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        const finalTop = Math.max(
          targetTop - headerHeight - anchorsHeight - ANCHOR_SCROLL_EXTRA_OFFSET,
          0,
        );

        window.scrollTo({
          top: finalTop,
          behavior: "smooth",
        });
      };

      const spacer = document.createElement("div");
      // Спейсер всегда в потоке: так его top стабильно отражает исходную позицию блока
      // и не вызывает дребезг переключения sticky/non-sticky до реального доскролла.
      spacer.style.display = "block";
      spacer.style.height = "0px";
      anchorsSection.parentNode.insertBefore(spacer, anchorsSection);

      let isSticky = false;
      let originalInlineStyle = anchorsSection.getAttribute("style") || "";

      const syncBodyFixedAnchorsClass = () => {
        const hasAnyStickyAnchors = Array.from(anchorsSections).some((section) =>
          section.classList.contains("is-sticky"),
        );
        document.body.classList.toggle(
          BODY_ANCHORS_FIXED_CLASS,
          hasAnyStickyAnchors,
        );
      };

      const setActiveLink = (activeIndex) => {
        links.forEach((link, index) => {
          link.classList.toggle("active", index === activeIndex);
        });
      };

      const updateActiveLinkByScroll = () => {
        const markerY =
          getHeaderHeight() +
          anchorsSection.getBoundingClientRect().height +
          ANCHOR_SCROLL_EXTRA_OFFSET +
          8;

        // Пока не дошли до первого целевого блока — активного пункта быть не должно.
        let activeIndex = -1;
        targets.forEach((target, index) => {
          if (!target) {
            return;
          }
          const targetTop = target.getBoundingClientRect().top;
          if (targetTop <= markerY) {
            activeIndex = index;
          }
        });

        setActiveLink(activeIndex);
      };

      const applyStickyStyles = () => {
        const spacerRect = spacer.getBoundingClientRect();
        const currentBg = getComputedStyle(anchorsSection).backgroundColor;
        const fallbackBg =
          currentBg && currentBg !== "rgba(0, 0, 0, 0)" ? currentBg : "#ffffff";

        anchorsSection.style.position = "fixed";
        anchorsSection.style.top = `${Math.max(getHeaderHeight() - 1, 0)}px`;
        anchorsSection.style.left = `${Math.round(spacerRect.left)}px`;
        anchorsSection.style.width = `${Math.round(spacerRect.width)}px`;
        anchorsSection.style.zIndex = "29";
        anchorsSection.style.margin = "0";
        anchorsSection.style.backgroundColor = fallbackBg;
        anchorsSection.style.boxShadow = "0 1px 20px rgba(85, 85, 85, 0.15)";
      };

      const stickAnchors = () => {
        if (isSticky) {
          return;
        }
        const sectionRect = anchorsSection.getBoundingClientRect();
        spacer.style.height = `${Math.round(sectionRect.height)}px`;
        isSticky = true;
        anchorsSection.classList.add("is-sticky");
        applyStickyStyles();
        syncBodyFixedAnchorsClass();
      };

      const unstickAnchors = () => {
        if (!isSticky) {
          return;
        }
        isSticky = false;
        spacer.style.height = "0px";
        anchorsSection.setAttribute("style", originalInlineStyle);
        anchorsSection.classList.remove("is-sticky");
        syncBodyFixedAnchorsClass();
      };

      const updateStickyState = () => {
        const headerHeight = getHeaderHeight();
        const triggerTop = spacer.getBoundingClientRect().top;

        if (triggerTop <= headerHeight) {
          stickAnchors();
        } else {
          unstickAnchors();
        }

        if (isSticky) {
          applyStickyStyles();
        }

        updateActiveLinkByScroll();
      };

      updateStickyState();
      window.addEventListener("scroll", updateStickyState);
      window.addEventListener("resize", updateStickyState);
      window.addEventListener("hashchange", updateStickyState);

      links.forEach((link, index) => {
        link.addEventListener("click", (event) => {
          const target = targets[index];
          if (!target) {
            return;
          }
          event.preventDefault();
          history.replaceState(null, "", `#${target.id}`);
          scrollToAnchorTarget(target);
        });
      });
    });
  }

  initStickyAnchors();
  // Конец скрипта: якорная навигация data-anchors

  // Начало скрипта: sticky-меню статьи (zabol-detail-right)
  function initZabolDetailStickyMenu() {
    const menu = document.querySelector(".zabol-detail-right .zabol-detail-menu-tabs");
    if (!menu) {
      return;
    }

    const container = menu.closest(".zabol-detail-right");
    if (!container) {
      return;
    }

    const links = Array.from(menu.querySelectorAll('a[href^="#"]')).filter(
      (link) => (link.getAttribute("href") || "").length > 1,
    );
    if (!links.length) {
      return;
    }

    const ZABOL_SCROLL_EXTRA_OFFSET = 30;
    const getHeaderHeight = () =>
      headerRoot ? Math.round(headerRoot.getBoundingClientRect().height) : 0;

    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const targets = links.map((link) => {
      const id = (link.getAttribute("href") || "").slice(1);
      return id ? document.getElementById(id) : null;
    });

    const spacer = document.createElement("div");
    spacer.style.display = "block";
    spacer.style.height = "0px";
    menu.parentNode.insertBefore(spacer, menu);

    const originalInlineStyle = menu.getAttribute("style") || "";
    const getMenuStableWidth = () =>
      Math.round(container.getBoundingClientRect().width || menu.getBoundingClientRect().width);

    const setActiveLink = (activeIndex) => {
      links.forEach((link, index) => {
        link.classList.toggle("active", index === activeIndex);
      });
    };

    const updateActiveLinkByScroll = () => {
      const markerY = getHeaderHeight() + ZABOL_SCROLL_EXTRA_OFFSET + 8;
      let activeIndex = 0;

      targets.forEach((target, index) => {
        if (!target) return;
        if (target.getBoundingClientRect().top <= markerY) {
          activeIndex = index;
        }
      });

      setActiveLink(activeIndex);
    };

    const applyFixedState = () => {
      const spacerRect = spacer.getBoundingClientRect();
      const stableWidth = getMenuStableWidth();
      const currentBg = getComputedStyle(menu).backgroundColor;
      const fallbackBg =
        currentBg && currentBg !== "rgba(0, 0, 0, 0)" ? currentBg : "#f6f7fc";

      menu.style.position = "fixed";
      menu.style.top = `${Math.max(getHeaderHeight() - 1, 0)}px`;
      menu.style.left = `${Math.round(spacerRect.left)}px`;
      menu.style.width = `${stableWidth}px`;
      menu.style.maxWidth = `${stableWidth}px`;
      menu.style.zIndex = "29";
      menu.style.margin = "0";
      menu.style.backgroundColor = fallbackBg;
      menu.style.boxShadow = "0 1px 20px rgba(85, 85, 85, 0.15)";
    };

    const applyBottomState = () => {
      const stableWidth = getMenuStableWidth();
      menu.style.position = "absolute";
      menu.style.top = "auto";
      menu.style.bottom = "0";
      menu.style.left = "0";
      menu.style.width = `${stableWidth}px`;
      menu.style.maxWidth = `${stableWidth}px`;
      menu.style.zIndex = "";
      menu.style.margin = "0";
      menu.style.boxShadow = "";
    };

    const applyNormalState = () => {
      menu.setAttribute("style", originalInlineStyle);
      spacer.style.height = "0px";
    };

    const updateStickyState = () => {
      const headerHeight = Math.max(getHeaderHeight() - 1, 0);
      const triggerTop = spacer.getBoundingClientRect().top;
      const menuHeight = Math.round(menu.getBoundingClientRect().height);
      const containerBottom =
        container.getBoundingClientRect().top +
        window.scrollY +
        container.offsetHeight;
      const maxFixedScrollY = containerBottom - headerHeight - menuHeight;

      if (triggerTop > headerHeight) {
        applyNormalState();
      } else if (window.scrollY >= maxFixedScrollY) {
        spacer.style.height = `${menuHeight}px`;
        applyBottomState();
      } else {
        spacer.style.height = `${menuHeight}px`;
        applyFixedState();
      }

      updateActiveLinkByScroll();
    };

    const scrollToAnchorTarget = (target) => {
      if (!target) return;
      const headerHeight = getHeaderHeight();
      const targetTop = target.getBoundingClientRect().top + window.scrollY;
      const finalTop = Math.max(
        targetTop - headerHeight - ZABOL_SCROLL_EXTRA_OFFSET,
        0,
      );

      window.scrollTo({
        top: finalTop,
        behavior: "smooth",
      });
    };

    links.forEach((link, index) => {
      link.addEventListener("click", (event) => {
        const target = targets[index];
        if (!target) return;
        event.preventDefault();
        history.replaceState(null, "", `#${target.id}`);
        scrollToAnchorTarget(target);
      });
    });

    updateStickyState();
    window.addEventListener("scroll", updateStickyState);
    window.addEventListener("resize", updateStickyState);
    window.addEventListener("hashchange", updateStickyState);
  }

  initZabolDetailStickyMenu();
  // Конец скрипта: sticky-меню статьи (zabol-detail-right)

  // Начало скрипта: коррекция крайних элементов about-story
  function initAboutStoryEdgeOffsets() {
    const stories = document.querySelectorAll(".about-story-content");
    if (!stories.length) {
      return;
    }

    const ABOUT_STORY_EDGE_OFFSETS_MIN_WIDTH = 971;

    const recalcStoryOffsets = (story) => {
      const storyItems = story.querySelectorAll(".about-story-content-item");
      if (!storyItems.length) {
        return;
      }

      const firstItem = storyItems[0];
      const preLastItem =
        storyItems.length > 1 ? storyItems[storyItems.length - 2] : null;

      const shouldApply = window.innerWidth >= ABOUT_STORY_EDGE_OFFSETS_MIN_WIDTH;
      if (!shouldApply) {
        if (firstItem) firstItem.style.marginTop = "";
        if (preLastItem) preLastItem.style.marginBottom = "";
        return;
      }

      const applyEdgeOffset = (item, cssProperty) => {
        if (!item) {
          return;
        }

        const defaultCard = item.querySelector(
          ".about-story-content-item-container .default",
        );
        if (!defaultCard) {
          item.style[cssProperty] = "";
          return;
        }

        const itemHeight = item.getBoundingClientRect().height;
        const cardHeight = defaultCard.getBoundingClientRect().height;
        const offset = Math.max((cardHeight - itemHeight) / 2, 0);

        item.style[cssProperty] = `${Math.ceil(offset)}px`;
      };

      applyEdgeOffset(firstItem, "marginTop");
      applyEdgeOffset(preLastItem, "marginBottom");
    };

    const runRecalc = () => {
      stories.forEach((story) => recalcStoryOffsets(story));
    };

    runRecalc();

    let resizeRafId = null;
    window.addEventListener("resize", () => {
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(() => {
        runRecalc();
      });
    });
  }

  initAboutStoryEdgeOffsets();
  // Конец скрипта: коррекция крайних элементов about-story

  // Начало скрипта: about-story "Показать еще" (мобилка)
  function initAboutStoryShowMore() {
    const MOBILE_MAX_WIDTH = 970;
    const VISIBLE_CARDS_COUNT = 3;

    const stories = Array.from(document.querySelectorAll(".about-story-section"));
    if (!stories.length) {
      return;
    }

    const setCollapsedStyles = (element) => {
      if (!element.dataset.aboutStoryOriginalMarginBottom) {
        element.dataset.aboutStoryOriginalMarginBottom =
          getComputedStyle(element).marginBottom;
      }

      element.style.overflow = "hidden";
      element.style.maxHeight = "0px";
      element.style.opacity = "0";
      element.style.transform = "translateY(-8px)";
      element.style.pointerEvents = "none";
      element.style.marginBottom = "0px";
      element.style.transition =
        "max-height 450ms ease, opacity 250ms ease, transform 250ms ease";
    };

    const setExpandedStyles = (element) => {
      const targetHeight = element.scrollHeight;
      element.style.overflow = "hidden";
      element.style.maxHeight = `${targetHeight}px`;
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
      element.style.pointerEvents = "";
      element.style.marginBottom =
        element.dataset.aboutStoryOriginalMarginBottom || "";
      element.style.transition =
        "max-height 450ms ease, opacity 250ms ease, transform 250ms ease";

      const onDone = (event) => {
        if (event.target !== element) return;
        if (event.propertyName !== "max-height") return;
        element.style.maxHeight = "";
        element.style.overflow = "";
        element.removeEventListener("transitionend", onDone);
      };
      element.addEventListener("transitionend", onDone);
    };

    const resetStyles = (element) => {
      element.style.overflow = "";
      element.style.maxHeight = "";
      element.style.opacity = "";
      element.style.transform = "";
      element.style.pointerEvents = "";
      element.style.marginBottom = "";
      element.style.transition = "";
    };

    const hideButton = (container) => {
      if (!container) return;
      container.classList.add("invise");
    };

    const showButton = (container) => {
      if (!container) return;
      container.classList.remove("invise");
    };

    const applyToStory = (section) => {
      const story = section.querySelector(".about-story-content");
      const buttonContainer = section.querySelector(
        ".about-story-content-button-container",
      );
      const button = section.querySelector(".about-story-content-button");
      if (!story) {
        return;
      }

      const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;

      const allItems = Array.from(
        story.querySelectorAll(".about-story-content-item"),
      );
      const cardItems = allItems.filter((item) => item.querySelector(".default"));

      // На десктопе/без мобилки — всё показываем, кнопку скрываем.
      if (!isMobile) {
        allItems.forEach((item) => resetStyles(item));
        hideButton(buttonContainer);
        if (button) button.removeAttribute("data-about-story-expanded");
        return;
      }

      // Если карточек <= 3 — ничего не скрываем, кнопку не показываем.
      if (cardItems.length <= VISIBLE_CARDS_COUNT) {
        allItems.forEach((item) => resetStyles(item));
        hideButton(buttonContainer);
        if (button) button.removeAttribute("data-about-story-expanded");
        return;
      }

      const isExpanded = button
        ? button.getAttribute("data-about-story-expanded") === "true"
        : false;

      if (isExpanded) {
        // Уже раскрыто — показываем всё и прячем кнопку.
        allItems.forEach((item) => resetStyles(item));
        hideButton(buttonContainer);
        return;
      }

      // Скрываем всё после 3-й карточки (последняя "точка" останется видимой).
      cardItems.forEach((item, index) => {
        if (index < VISIBLE_CARDS_COUNT) {
          resetStyles(item);
          return;
        }
        setCollapsedStyles(item);
      });

      // Все не-карточные элементы (последняя точка/линию) не трогаем.
      allItems
        .filter((item) => !item.querySelector(".default"))
        .forEach((item) => resetStyles(item));

      showButton(buttonContainer);

      if (button && !button.__aboutStoryShowMoreBound) {
        button.__aboutStoryShowMoreBound = true;
        button.addEventListener("click", () => {
          button.setAttribute("data-about-story-expanded", "true");

          cardItems.forEach((item, index) => {
            if (index < VISIBLE_CARDS_COUNT) return;

            // Принудительно пересчитаем высоту перед раскрытием
            item.style.display = "";
            setExpandedStyles(item);
          });

          // Плавно прячем кнопку (без мелькания invise)
          if (buttonContainer) {
            buttonContainer.style.transition = "opacity 250ms ease";
            buttonContainer.style.opacity = "0";
            window.setTimeout(() => {
              buttonContainer.style.opacity = "";
              buttonContainer.style.transition = "";
              hideButton(buttonContainer);
            }, 260);
          }
        });
      }
    };

    const run = () => {
      stories.forEach((section) => applyToStory(section));
    };

    run();

    let raf = null;
    window.addEventListener("resize", () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => run());
    });
  }

  initAboutStoryShowMore();
  // Конец скрипта: about-story "Показать еще" (мобилка)

  // Начало скрипта: состояние мобильного меню
  var headerSyncMenuToggleState = function () {
    var headerMenuIsOpen = document.body.classList.contains("header-menu-open");
    var headerMobileToggleButtons = document.querySelectorAll(
      ".header-mobile-toggle",
    );

    headerMobileToggleButtons.forEach(function (headerMobileToggleButton) {
      headerMobileToggleButton.setAttribute(
        "aria-expanded",
        headerMenuIsOpen ? "true" : "false",
      );
      headerMobileToggleButton.setAttribute(
        "aria-label",
        headerMenuIsOpen ? "Закрыть меню" : "Открыть меню",
      );
    });
  };

  var headerSetMenuState = function (headerShouldOpen) {
    document.body.classList.toggle("header-menu-open", headerShouldOpen);
    if (headerRoot) {
      headerRoot.classList.toggle("header-menu-open", headerShouldOpen);
    }
    headerSyncMenuToggleState();
  };

  var headerMenuStateObserver = new MutationObserver(function () {
    headerSyncMenuToggleState();
  });

  headerMenuStateObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    childList: true,
    subtree: true,
  });

  headerSyncMenuToggleState();
  // Конец скрипта: состояние мобильного меню

  // Начало скрипта: обработчики кликов хедера
  var headerHandleSearchButtonClick = function (event, headerEventTarget) {
    var headerSearchOpenButton =
      headerEventTarget.closest("[data-open-search]");
    if (!headerSearchOpenButton) {
      return false;
    }

    event.preventDefault();

    if (!document.body.classList.contains("header-menu-open")) {
      headerSetMenuState(true);
    }

    window.setTimeout(function () {
      var headerMobileSearchInput =
        document.querySelector(".header-mobile input[type='text'][name='q']") ||
        document.getElementById("title-search-input");

      if (headerMobileSearchInput) {
        headerMobileSearchInput.focus();
      }
    }, 80);

    return true;
  };

  var headerHandleMenuToggleClick = function (event, headerEventTarget) {
    var headerToggleButton = headerEventTarget.closest(
      "[data-open-mobile-menu]",
    );
    if (!headerToggleButton) {
      return false;
    }

    event.preventDefault();
    headerSetMenuState(!document.body.classList.contains("header-menu-open"));
    return true;
  };

  var headerHandleOverlayClick = function (headerEventTarget) {
    var headerOverlay = headerEventTarget.closest(".header__overlay");
    if (!headerOverlay) {
      return false;
    }

    headerSetMenuState(false);
    return true;
  };

  var headerHandleBackButtonClick = function (event, headerEventTarget) {
    var headerBackButton = headerEventTarget.closest(
      ".header-menu-link_drop_back_btn",
    );
    if (!headerBackButton || !headerIsMobileMenuViewport()) {
      return false;
    }

    event.preventDefault();

    var headerBackLevel = headerGetMenuLevelByClass(
      headerBackButton,
      "header-menu-link_drop_back_btn_",
    );

    if (!headerBackLevel) {
      return true;
    }

    if (headerBackLevel === 1) {
      if (headerHiddenContainer) {
        headerHiddenContainer.classList.remove("no-scroll");
      }
    } else {
      var headerBackLevelContainer = headerBackButton.closest(
        ".header-menu-level-" + headerBackLevel + "-cont",
      );
      if (headerBackLevelContainer) {
        headerBackLevelContainer.classList.remove("no-scroll");
      }
    }

    var headerOpenedNextLevelContainer = headerBackButton.closest(
      ".header-menu-level-" + (headerBackLevel + 1) + "-cont",
    );
    if (headerOpenedNextLevelContainer) {
      headerOpenedNextLevelContainer.classList.remove(
        "header-menu-level-cont-open",
      );
    }

    return true;
  };

  var headerHandleDropContainerClick = function (event, headerEventTarget) {
    var headerDropContainer = headerEventTarget.closest(".header_drop_cont");
    if (!headerDropContainer || !headerIsMobileMenuViewport()) {
      return false;
    }

    event.preventDefault();

    var headerDropLevel = headerGetMenuLevelByClass(
      headerDropContainer,
      "header_drop_cont_",
    );
    if (!headerDropLevel) {
      return true;
    }

    if (headerDropLevel === 1) {
      if (headerHiddenContainer) {
        headerHiddenContainer.classList.add("no-scroll");
      }
    } else {
      var headerCurrentLevelContainer = headerDropContainer.closest(
        ".header-menu-level-" + headerDropLevel + "-cont",
      );
      if (headerCurrentLevelContainer) {
        headerCurrentLevelContainer.classList.add("no-scroll");
      }
    }

    var headerDropContainerParent = headerDropContainer.parentElement;
    if (!headerDropContainerParent) {
      return true;
    }

    var headerNextLevelContainer = headerDropContainerParent.querySelector(
      ".header-menu-level-" + (headerDropLevel + 1) + "-cont",
    );
    if (headerNextLevelContainer) {
      headerNextLevelContainer.classList.add("header-menu-level-cont-open");
    }

    return true;
  };

  var headerHandleDataHrefClick = function (
    event,
    headerEventTarget,
    headerOpenInNewTab,
  ) {
    var headerDataHrefElement = headerEventTarget.closest("[data-href]");
    if (!headerDataHrefElement) {
      return false;
    }

    if (
      headerIsMobileMenuViewport() &&
      headerDataHrefElement.classList.contains("header_drop_cont")
    ) {
      return false;
    }

    var headerAnchorInside = headerEventTarget.closest("a[href]");
    if (headerHasNavigableHref(headerAnchorInside)) {
      return false;
    }

    event.preventDefault();
    headerOpenHref(
      headerDataHrefElement.getAttribute("data-href"),
      headerOpenInNewTab || event.ctrlKey || event.metaKey,
    );
    return true;
  };

  document.addEventListener("click", function (event) {
    var headerEventTarget = headerGetSafeEventTarget(event);
    if (!headerEventTarget) {
      return;
    }

    if (headerHandleSearchButtonClick(event, headerEventTarget)) {
      return;
    }
    if (headerHandleMenuToggleClick(event, headerEventTarget)) {
      return;
    }
    if (headerHandleOverlayClick(headerEventTarget)) {
      return;
    }
    if (headerHandleBackButtonClick(event, headerEventTarget)) {
      return;
    }
    if (headerHandleDropContainerClick(event, headerEventTarget)) {
      return;
    }
    headerHandleDataHrefClick(event, headerEventTarget, false);
  });

  document.addEventListener("auxclick", function (event) {
    if (event.button !== 1) {
      return;
    }

    var headerEventTarget = headerGetSafeEventTarget(event);
    if (!headerEventTarget) {
      return;
    }

    headerHandleDataHrefClick(event, headerEventTarget, true);
  });
  // Конец скрипта: обработчики кликов хедера

  // Начало скрипта: обработчики кликов на табах
  if (document.querySelector("[data-tabs-content]")) {
    const tabsContent = document.querySelectorAll("[data-tabs-content]");
    tabsContent.forEach((content) => {
      const isOwnTabNode = (element) =>
        element.closest("[data-tabs-content]") === content;
      const tabsExtraOffset = 24;
      const tabsModeAttr = content.getAttribute("data-tabs-content") || "";
      const isNestedMode = tabsModeAttr === "nested";

      function getHashTabId() {
        if (!window.location.hash || window.location.hash === "#") return null;
        try {
          return decodeURIComponent(window.location.hash.substring(1));
        } catch (err) {
          return window.location.hash.substring(1);
        }
      }

      function scrollToTab(tabElement, behavior = "smooth") {
        if (!tabElement) return;
        const currentHeaderOffset = headerRoot
          ? headerRoot.getBoundingClientRect().height
          : 0;
        const targetTop =
          tabElement.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = Math.max(
          targetTop - currentHeaderOffset - tabsExtraOffset,
          0,
        );

        window.scrollTo({
          top: offsetPosition,
          behavior,
        });
      }

      if (isNestedMode) {
        const nestedAdultSubIds = [
          "specialists",
          "diagnostics",
          "surgery",
          "analyses",
          "diseases",
        ];
        const nestedChildSubIds = [
          "children-specialists",
          "children-diagnostics",
          "children-surgery",
        ];

        function nestedTabIdToAudience(tabId) {
          if (tabId === "adults" || tabId === "children") {
            return tabId;
          }
          if (nestedAdultSubIds.includes(tabId)) {
            return "adults";
          }
          if (nestedChildSubIds.includes(tabId)) {
            return "children";
          }
          return null;
        }

        const rowAdults = content.querySelector(
          '[data-tabs-audience-row="adults"]',
        );
        const rowChildren = content.querySelector(
          '[data-tabs-audience-row="children"]',
        );
        const audienceSwitch = content.querySelector(
          "[data-tabs-audience-switch]",
        );
        const panelItems = Array.from(
          content.querySelectorAll(
            ".main-specialists__list[data-tabs-content-item]",
          ),
        ).filter(isOwnTabNode);
        const audienceTabItems = audienceSwitch
          ? Array.from(
              audienceSwitch.querySelectorAll("[data-tabs-item]"),
            ).filter(isOwnTabNode)
          : [];
        const subTabItems = Array.from(
          content.querySelectorAll("[data-tabs-audience-row] [data-tabs-item]"),
        ).filter(isOwnTabNode);

        function nestedShowAudience(audience) {
          if (rowAdults && rowChildren) {
            if (audience === "adults") {
              rowAdults.classList.remove("invise");
              rowChildren.classList.add("invise");
            } else {
              rowAdults.classList.add("invise");
              rowChildren.classList.remove("invise");
            }
          }
          audienceTabItems.forEach((tab) => {
            const id = tab.getAttribute("data-tabs-item");
            tab.classList.toggle("active", id === audience);
          });
        }

        function nestedActivatePanel(panelId) {
          panelItems.forEach((panel) => {
            const pid = panel.getAttribute("data-tabs-content-item");
            const isActive = pid === panelId;
            panel.classList.toggle("active", isActive);
            panel.classList.toggle("invise", !isActive);
          });
        }

        function nestedActivateSubTab(panelId) {
          subTabItems.forEach((tab) => {
            tab.classList.toggle(
              "active",
              tab.getAttribute("data-tabs-item") === panelId,
            );
          });
        }

        function nestedActivateFromState(audience, panelId) {
          nestedShowAudience(audience);
          nestedActivatePanel(panelId);
          nestedActivateSubTab(panelId);
        }

        function nestedActivate(tabId) {
          if (!tabId) {
            return false;
          }
          if (tabId === "adults") {
            nestedActivateFromState("adults", "specialists");
            return true;
          }
          if (tabId === "children") {
            nestedActivateFromState("children", "children-specialists");
            return true;
          }
          const audience = nestedTabIdToAudience(tabId);
          if (!audience) {
            return false;
          }
          nestedActivateFromState(audience, tabId);
          return true;
        }

        const initialHashTabId = getHashTabId();
        if (!initialHashTabId || !nestedActivate(initialHashTabId)) {
          nestedActivateFromState("adults", "specialists");
        }

        window.addEventListener("hashchange", function () {
          const hashTabId = getHashTabId();
          if (!hashTabId || !nestedActivate(hashTabId)) {
            return;
          }
        });

        const nestedClickableTabs = Array.from(
          new Set([...audienceTabItems, ...subTabItems]),
        );
        nestedClickableTabs.forEach((tab) => {
          tab.addEventListener("click", () => {
            const tabId = tab.getAttribute("data-tabs-item");
            nestedActivate(tabId);
          });
        });

        return;
      }

      const tabsContainer = Array.from(
        content.querySelectorAll("[data-tabs]"),
      ).find(isOwnTabNode);
      const tabsItems = Array.from(
        content.querySelectorAll("[data-tabs-item]"),
      ).filter(isOwnTabNode);
      const tabsContentItems = Array.from(
        content.querySelectorAll("[data-tabs-content-item]"),
      ).filter(isOwnTabNode);
      const tabsMode = tabsModeAttr;
      const isViewAllMode = tabsMode === "view_all";
      const isToggleMode =
        tabsContainer && tabsContainer.getAttribute("data-tabs") === "toggle";

      function activateTabById(tabId) {
        if (!tabId) return false;
        const targetTab = tabsItems.find(
          (item) => item.getAttribute("data-tabs-item") === tabId,
        );
        if (!targetTab) return false;

        tabsContentItems.forEach((item) => {
          item.style.display = "";
        });

        tabsItems.forEach((item) => {
          item.classList.remove("active");
        });

        tabsContentItems.forEach((item) => {
          item.classList.remove("active");
        });

        targetTab.classList.add("active");
        const correspondingContent = tabsContentItems.find(
          (item) => item.getAttribute("data-tabs-content-item") === tabId,
        );
        if (correspondingContent) {
          correspondingContent.classList.add("active");
        }
        return true;
      }

      function showAllTabContentItems() {
        tabsContentItems.forEach((item) => {
          item.classList.remove("active");
          item.style.display = "block";
        });
      }

      function deactivateAllTabs(showAllContentItems = false) {
        tabsItems.forEach((item) => {
          item.classList.remove("active");
        });

        tabsContentItems.forEach((item) => {
          item.classList.remove("active");
        });

        if (showAllContentItems) {
          showAllTabContentItems();
          return;
        }

        tabsContentItems.forEach((item) => {
          item.style.display = "";
        });
      }

      // Инициализация: первому табу и первому контенту добавляем active, остальным удаляем
      if (isViewAllMode) {
        deactivateAllTabs(true);
      }

      tabsItems.forEach((item, index) => {
        if (!isViewAllMode && tabsMode !== "no-first-active-tabs") {
          if (index === 0) {
            item.classList.add("active");
          } else {
            item.classList.remove("active");
          }
        }
      });

      tabsContentItems.forEach((item, index) => {
        if (!isViewAllMode && tabsMode !== "no-first-active-tabs") {
          if (index === 0) {
            item.classList.add("active");
          } else {
            item.classList.remove("active");
          }
        }
      });

      const initialHashTabId = getHashTabId();
      if (
        !isViewAllMode &&
        initialHashTabId &&
        activateTabById(initialHashTabId)
      ) {
        const initialTab = tabsItems.find(
          (item) => item.getAttribute("data-tabs-item") === initialHashTabId,
        );
        scrollToTab(initialTab, "auto");
      }

      window.addEventListener("hashchange", function () {
        const hashTabId = getHashTabId();
        if (!hashTabId) return;
        if (activateTabById(hashTabId)) {
          const hashTab = tabsItems.find(
            (item) => item.getAttribute("data-tabs-item") === hashTabId,
          );
          scrollToTab(hashTab, "smooth");
        }
      });

      // Обработка кликов на табы
      tabsItems.forEach((tab) => {
        tab.addEventListener("click", () => {
          const tabId = tab.getAttribute("data-tabs-item");
          if (isToggleMode && tab.classList.contains("active")) {
            deactivateAllTabs(true);
            return;
          }
          activateTabById(tabId);
        });
      });
    });
  }
  // Конец скрипта: обработчики кликов на табах

  // Начало скрипта: очистка поля поиска в main-specialists
  const specialistSearchForms = document.querySelectorAll(".main-specialists__form");
  specialistSearchForms.forEach((form) => {
    const input = form.querySelector(".main-specialists__form-input");
    const clearBtn = form.querySelector(".main-specialists__form-button-clear");
    if (!input || !clearBtn) return;

    const syncHasValueClass = () => {
      form.classList.toggle("has-value", Boolean((input.value || "").trim()));
    };

    input.addEventListener("input", syncHasValueClass);

    clearBtn.addEventListener("click", (event) => {
      event.preventDefault();
      input.value = "";
      syncHasValueClass();
      input.focus();
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    syncHasValueClass();
  });
  // Конец скрипта: очистка поля поиска в main-specialists

  // Начало скрипта: обработчики кликов на форме
  let rezultForm = document.querySelector(".rezult-form");
  let titlePopupCheck = document.querySelector(".rezult-form-container-title");

  let loadSvg = document.getElementById("load-svg");

  function addLoad() {
    if (loadSvg) {
      loadSvg.classList.add("open");
    }
  }
  function removeLoad() {
    if (loadSvg) {
      loadSvg.classList.remove("open");
    }
  }

  if (rezultForm) {
    let rezultFormCloseBtnIcon = rezultForm.querySelector(
      ".rezult-form-close-btn-icon",
    );
    rezultFormCloseBtnIcon.addEventListener("click", function () {
      rezultForm.classList.remove("opened");
    });
    rezultForm.addEventListener("click", function (e) {
      if (e.target.closest(".rezult-form-container")) {
        return;
      }
      rezultForm.classList.remove("opened");
    });
  }

  // Начало скрипта: popup-форма
  const POPUP_FORM_DEFAULTS = {
    title: "Оставить заявку",
    buttonText: "Отправить",
  };

  function getPopupFormElementById(popupId) {
    if (!popupId) return null;
    return document.getElementById(popupId);
  }

  function getPopupDynamicText(trigger, attrName, fallbackValue) {
    if (!trigger) return fallbackValue;
    const value = trigger.getAttribute(attrName);
    if (value === null) return fallbackValue;
    const trimmed = value.trim();
    return trimmed || fallbackValue;
  }

  function resetPopupFormState(popup) {
    const form = popup.querySelector("form[data-form]");
    if (!form) return;

    form.removeAttribute("data-submitted");

    form.querySelectorAll("[data-popup-info-input]").forEach((input) => {
      input.remove();
    });

    form.querySelectorAll("[data-error]").forEach((errorBlock) => {
      const customClass = errorBlock.getAttribute("data-error");
      const classToRemove =
        customClass && customClass.trim() ? customClass.trim() : "error";
      errorBlock.classList.remove(classToRemove);
    });

    form.querySelectorAll('input:not([type="hidden"])').forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
        return;
      }
      input.value = "";
    });

    const captchaInput = form.querySelector('input[name="captcha_token"]');
    if (captchaInput) {
      captchaInput.value = "";
    }

    form
      .querySelectorAll('button[type="submit"], input[type="submit"]')
      .forEach((submitBtn) => {
        submitBtn.disabled = false;
      });
  }

  function applyPopupInfoHiddenInputs(popup, trigger) {
    const form = popup.querySelector("form[data-form]");
    if (!form || !trigger) return;

    Array.from(trigger.attributes).forEach((attr) => {
      if (!attr || !attr.name || !attr.name.startsWith("data-info-")) {
        return;
      }
      const inputName = attr.name.replace("data-info-", "");
      if (!inputName) return;

      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = inputName;
      hidden.value = attr.value || "";
      hidden.setAttribute("data-popup-info-input", "true");
      form.appendChild(hidden);
    });
  }

  function openPopupFormByTrigger(trigger) {
    const popupId = trigger.getAttribute("data-popup-open");
    const popup = getPopupFormElementById(popupId);
    if (!popup || !popup.classList.contains("popup-form")) {
      return;
    }

    const title = getPopupDynamicText(
      trigger,
      "data-popup-form-title",
      POPUP_FORM_DEFAULTS.title,
    );
    const buttonText = getPopupDynamicText(
      trigger,
      "data-popup-form-btn-text",
      POPUP_FORM_DEFAULTS.buttonText,
    );

    const titleNode = popup.querySelector(".popup-form-title");
    const submitBtn = popup.querySelector(".popup-form-submit");
    if (titleNode) titleNode.textContent = title;
    if (submitBtn) submitBtn.textContent = buttonText;

    resetPopupFormState(popup);
    applyPopupInfoHiddenInputs(popup, trigger);

    popup.classList.add("active");
    popup.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closePopupForm(popup) {
    if (!popup) return;
    popup.classList.remove("active");
    popup.setAttribute("aria-hidden", "true");

    if (!document.querySelector(".popup.active")) {
      document.body.classList.remove("no-scroll");
    }
  }

  document.addEventListener("click", function (event) {
    const openTrigger = event.target.closest("[data-popup-open]");
    if (openTrigger) {
      event.preventDefault();
      openPopupFormByTrigger(openTrigger);
      return;
    }

    const closeTrigger = event.target.closest("[data-popup-close]");
    if (!closeTrigger) return;
    const popup = closeTrigger.closest(".popup");
    closePopupForm(popup);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    const openedPopup = document.querySelector(".popup.active");
    if (openedPopup) {
      closePopupForm(openedPopup);
    }
  });
  // Конец скрипта: popup-форма

  let widgetId;

  function handleCaptcha(btn, input) {
    if (!window.smartCaptcha) {
      console.error("SmartCaptcha не загружен.");
      return;
    }

    widgetId = window.smartCaptcha.render(`captcha-container`, {
      sitekey: "yoo-key", // Замените на ваш Client Key
      invisible: true, // Указываем, что капча невидимая
      callback: (token) => {
        input.value = token;
        btn.disabled = false;
        btn.click();
      },
    });
  }

  /**
   * Маски полей формы. Редактируйте объект phone для смены шаблона/разбивки.
   * data-mask без значения → маска phone; data-mask="phone" → то же; иные значения — задел на будущее.
   */
  const FORM_INPUT_MASKS = {
    phone: {
      /** Сколько цифр после +7 (без кода страны) */
      nationalDigitsLength: 10,
      /**
       * Длины групп после «+7 (»: [3,3,2,2] → +7 (___) ___-__-__
       * Разделители между группами (после закрывающей «)» и между блоками).
       */
      groupLengths: [3, 3, 2, 2],
      /** Символ пустой позиции в маске (кроме первой группы в скобках) */
      emptyChar: "_",
      /** Пустые слоты внутри ( ) — по умолчанию пробел: вид «+7 (   ) ___-__-__» */
      emptyCharInParens: " ",
      format(nationalDigitsRaw) {
        const cfg = FORM_INPUT_MASKS.phone;
        let d = String(nationalDigitsRaw || "").replace(/\D/g, "");

        while (d.length > 0 && (d[0] === "7" || d[0] === "8")) {
          d = d.slice(1);
        }

        d = d.slice(0, cfg.nationalDigitsLength);

        const lens = cfg.groupLengths;
        const chunks = [];
        let offset = 0;
        for (let i = 0; i < lens.length; i += 1) {
          const len = lens[i];
          chunks.push(d.slice(offset, offset + len));
          offset += len;
        }

        const fill = (chunk, len, useParenChar) => {
          const empty = useParenChar ? cfg.emptyCharInParens : cfg.emptyChar;
          const pad = len - chunk.length;
          return chunk + (pad > 0 ? empty.repeat(pad) : "");
        };

        const a = fill(chunks[0] || "", lens[0], true);
        const b = fill(chunks[1] || "", lens[1], false);
        const c = fill(chunks[2] || "", lens[2], false);
        const e = fill(chunks[3] || "", lens[3], false);

        return `+7 (${a}) ${b}-${c}-${e}`;
      },
      parseToNationalDigits(displayValue) {
        const cfg = FORM_INPUT_MASKS.phone;
        let d = String(displayValue || "").replace(/\D/g, "");

        while (d.length > 0 && (d[0] === "7" || d[0] === "8")) {
          d = d.slice(1);
        }

        return d.slice(0, cfg.nationalDigitsLength);
      },
      isComplete(displayValue) {
        const d = FORM_INPUT_MASKS.phone.parseToNationalDigits(displayValue);
        return d.length === FORM_INPUT_MASKS.phone.nationalDigitsLength;
      },
    },
  };

  /** Сколько «национальных» цифр (после +7) слева от позиции курсора в текущей строке. */
  function phoneNationalDigitsBeforeCursor(displayValue, cursorPos) {
    const slice = displayValue.slice(0, Math.max(0, cursorPos));
    let d = slice.replace(/\D/g, "");
    while (d.length > 0 && (d[0] === "7" || d[0] === "8")) {
      d = d.slice(1);
    }
    return Math.min(d.length, FORM_INPUT_MASKS.phone.nationalDigitsLength);
  }

  /** Поставить курсор сразу после n-й национальной цифры (0 — перед первой цифрой в скобках). */
  function phoneSetCursorAfterNationalDigits(input, formatted, nationalCount) {
    const openIdx = formatted.indexOf("(");
    if (openIdx < 0) {
      input.setSelectionRange(formatted.length, formatted.length);
      return;
    }
    if (nationalCount <= 0) {
      input.setSelectionRange(openIdx + 1, openIdx + 1);
      return;
    }
    let seen = 0;
    for (let i = openIdx + 1; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) {
        seen += 1;
        if (seen === nationalCount) {
          input.setSelectionRange(i + 1, i + 1);
          return;
        }
      }
    }
    input.setSelectionRange(formatted.length, formatted.length);
  }

  function getInputMaskType(field) {
    if (!field || !field.hasAttribute("data-mask")) {
      return null;
    }
    const v = field.getAttribute("data-mask");
    if (v === null || String(v).trim() === "") {
      return "phone";
    }
    return String(v).trim();
  }

  function isPhoneMaskedField(field) {
    return field.hasAttribute("data-phone") || getInputMaskType(field) === "phone";
  }

  function isDateField(field) {
    return (
      field &&
      (field.hasAttribute("data-date") ||
        String(field.type || "").toLowerCase() === "date")
    );
  }

  function initDateField(field) {
    if (!isDateField(field)) {
      return;
    }

    const preferredPlaceholder =
      field.getAttribute("data-date-placeholder") ||
      field.getAttribute("placeholder") ||
      "";

    if (
      preferredPlaceholder &&
      !field.getAttribute("data-date-placeholder")
    ) {
      field.setAttribute("data-date-placeholder", preferredPlaceholder);
    }

    const switchToTextMode = () => {
      field.type = "text";
      if (preferredPlaceholder) {
        field.setAttribute("placeholder", preferredPlaceholder);
      }
    };

    const switchToDateMode = () => {
      field.type = "date";
      if (preferredPlaceholder) {
        // В режиме date браузер сам рисует формат,
        // поэтому убираем placeholder, чтобы не было конфликта.
        field.removeAttribute("placeholder");
      }
    };

    // Запрет будущих дат.
    const todayIso = new Date().toISOString().split("T")[0];
    field.setAttribute("max", todayIso);
    field.setAttribute("data-date", "");

    // Для пустого поля показываем пользовательский placeholder.
    if ((field.value || "").trim() === "") {
      switchToTextMode();
    } else {
      switchToDateMode();
    }

    if (!field.dataset.datePlaceholderBound) {
      field.dataset.datePlaceholderBound = "true";

      const openPickerOnFirstClick = () => {
        // Если поле уже date — ничего не делаем.
        if (String(field.type || "").toLowerCase() === "date") {
          return;
        }

        switchToDateMode();

        // Ставим фокус и, где поддерживается, сразу показываем календарь.
        field.focus();
        if (typeof field.showPicker === "function") {
          requestAnimationFrame(() => {
            try {
              field.showPicker();
            } catch (e) {
              // Игнор: showPicker может быть недоступен/ограничен браузером.
            }
          });
        }
      };

      field.addEventListener("pointerdown", openPickerOnFirstClick);
      field.addEventListener("mousedown", openPickerOnFirstClick);

      field.addEventListener("focus", () => {
        switchToDateMode();
      });

      field.addEventListener("blur", () => {
        if ((field.value || "").trim() === "") {
          switchToTextMode();
        }
      });
    }
  }

  function applyDataMaskToInput(input) {
    const maskType = getInputMaskType(input);
    if (!maskType || maskType !== "phone" || !FORM_INPUT_MASKS.phone) {
      return;
    }

    const mask = FORM_INPUT_MASKS.phone;

    function applyFormattedFromRaw(rawVal, rawSel) {
      const newNat = mask.parseToNationalDigits(rawVal);
      const formatted = mask.format(newNat);
      let caretNat = phoneNationalDigitsBeforeCursor(rawVal, rawSel);
      caretNat = Math.max(0, Math.min(caretNat, newNat.length));
      input.value = formatted;
      phoneSetCursorAfterNationalDigits(input, formatted, caretNat);
    }

    input.addEventListener("focus", function () {
      if (!mask.parseToNationalDigits(input.value)) {
        input.value = mask.format("");
        phoneSetCursorAfterNationalDigits(input, input.value, 0);
      }
    });

    input.addEventListener("beforeinput", function (e) {
      if (e.inputType === "insertText" && e.data) {
        const ch = e.data;
        if (/^[+78]$/.test(ch)) {
          const start = input.selectionStart ?? 0;
          if (start <= 3) {
            e.preventDefault();
          }
        }
      }
    });

    input.addEventListener("input", function () {
      const rawVal = input.value;
      const rawSel = input.selectionStart ?? 0;
      applyFormattedFromRaw(rawVal, rawSel);
    });

    if (input.value) {
      applyFormattedFromRaw(input.value, input.value.length);
    }
  }

  function handleForms() {
    if (document.querySelector("[data-form]")) {
      let forms = document.querySelectorAll("[data-form]");


      forms.forEach((form) => {
        if (!form.classList.contains("form-checked")) {
          form.classList.add("form-checked");

          form.querySelectorAll("[data-mask]").forEach((maskedInput) => {
            applyDataMaskToInput(maskedInput);
          });

          if (form.querySelector("[data-def-value]")) {
            let defValueInp = form.querySelectorAll("[data-def-value]");

            defValueInp.forEach((item) => {
              let value = item.getAttribute("data-def-value");
              item.value = value;
            });
          }

          const submitButtons = form.querySelectorAll(
            'button[type="submit"], input[type="submit"]',
          );
          const requiredFields = form.querySelectorAll("[data-required]");

          form.querySelectorAll("input[data-date], input[type='date']").forEach(
            (dateInput) => {
              initDateField(dateInput);
            },
          );

          function getErrorConfig(field) {
            const errorTarget = field.closest("[data-error]");
            const errorClass =
              errorTarget && errorTarget.getAttribute("data-error")
                ? errorTarget.getAttribute("data-error").trim()
                : "error";

            return {
              errorTarget: errorTarget,
              classToAdd: errorClass || "error",
            };
          }

          function validateField(field) {
            if (field.hasAttribute("data-min")) {
              const min = parseInt(field.getAttribute("data-min"), 10) || 0;
              const value = (field.value || "").trim();
              return value.length >= min;
            }

            if (isPhoneMaskedField(field)) {
              const rawValue = (field.value || "").trim();
              if (!rawValue || rawValue.indexOf("_") !== -1) {
                return false;
              }

              const national = FORM_INPUT_MASKS.phone.parseToNationalDigits(rawValue);
              return national.length === FORM_INPUT_MASKS.phone.nationalDigitsLength;
            }

            if (field.hasAttribute("data-checkbox")) {
              const checkboxContainer =
                field.closest("[data-error]") || field.parentElement;
              const checkbox = checkboxContainer
                ? checkboxContainer.querySelector('input[type="checkbox"]')
                : null;
              return !!(checkbox && checkbox.checked);
            }

            if (field.hasAttribute("data-select-required")) {
              const value = (field.value || "").trim();
              return value.length > 0;
            }

            if (isDateField(field)) {
              const value = (field.value || "").trim();
              if (!value) {
                return false;
              }

              const maxAttr = field.getAttribute("max");
              if (maxAttr && value > maxAttr) {
                return false;
              }

              return true;
            }

            const value = (field.value || "").trim();
            return value.length > 0;
          }

          function renderFieldError(field, forceShow) {
            const config = getErrorConfig(field);
            if (!config.errorTarget) {
              return validateField(field);
            }

            const isValid = validateField(field);

            if (!forceShow) {
              config.errorTarget.classList.remove(config.classToAdd);
              return isValid;
            }

            if (isValid) {
              config.errorTarget.classList.remove(config.classToAdd);
            } else {
              config.errorTarget.classList.add(config.classToAdd);
            }

            return isValid;
          }

          function validateForm(forceShow) {
            let hasErrors = false;

            requiredFields.forEach((field) => {
              const isValid = renderFieldError(field, forceShow);
              if (!isValid) {
                hasErrors = true;
              }
            });

            return !hasErrors;
          }

          function isFormValidNow() {
            let valid = true;
            requiredFields.forEach((field) => {
              if (!validateField(field)) {
                valid = false;
              }
            });
            return valid;
          }

          function syncSubmitButtonsState() {
            // До первого submit кнопку не трогаем.
            if (!form.hasAttribute("data-submitted")) {
              return;
            }

            const valid = isFormValidNow();
            submitButtons.forEach((btn) => {
              btn.disabled = !valid;
            });
          }

          requiredFields.forEach((field) => {
            const eventName =
              field.hasAttribute("data-checkbox") ||
              field.hasAttribute("data-select-required") ||
              isDateField(field)
                ? "change"
                : "input";

            if (field.hasAttribute("data-checkbox")) {
              const checkboxContainer =
                field.closest("[data-error]") || field.parentElement;
              const checkbox = checkboxContainer
                ? checkboxContainer.querySelector('input[type="checkbox"]')
                : null;

              if (checkbox) {
                checkbox.addEventListener(eventName, function () {
                  if (form.hasAttribute("data-submitted")) {
                    renderFieldError(field, true);
                    syncSubmitButtonsState();
                  }
                });
              }
            } else {
              field.addEventListener(eventName, function () {
                if (form.hasAttribute("data-submitted")) {
                  renderFieldError(field, true);
                  syncSubmitButtonsState();
                }
              });

              if (isPhoneMaskedField(field)) {
                ["keyup", "change", "blur"].forEach((phoneEvent) => {
                  field.addEventListener(phoneEvent, function () {
                    if (form.hasAttribute("data-submitted")) {
                      renderFieldError(field, true);
                      syncSubmitButtonsState();
                    }
                  });
                });
              }
            }
          });

          function clearInputs() {
            form
              .querySelectorAll('input:not([type="hidden"])')
              .forEach((input) => {
                input.value = "";

                // Сбрасываем состояние маски телефона после программной очистки.
                if (input.type === "tel" && window.jQuery) {
                  const $input = window.jQuery(input);
                  $input
                    .val("")
                    .trigger("input")
                    .trigger("change")
                    .trigger("keyup");
                }

                // Для календарей возвращаем состояние с placeholder после очистки.
                if (isDateField(input)) {
                  const placeholder =
                    input.getAttribute("data-date-placeholder") ||
                    input.getAttribute("placeholder") ||
                    "";
                  input.type = "text";
                  if (placeholder) {
                    input.setAttribute("placeholder", placeholder);
                  }
                }
              });

            form.querySelectorAll("select").forEach((select) => {
              select.selectedIndex = 0;
              select.dispatchEvent(new Event("change", { bubbles: true }));
            });

            form.querySelector('input[name="captcha_token"]').value = "";
            form.querySelector('input[name="checkbox"]').checked = false;

            if (form.querySelector("[data-def-value]")) {
              let defValueInp = form.querySelectorAll("[data-def-value]");

              defValueInp.forEach((item) => {
                let value = item.getAttribute("data-def-value");
                item.value = value;
              });
            }
          }
          function clearCaptcha() {
            window.smartCaptcha.destroy(widgetId);
            form.querySelector('input[name="captcha_token"]').value = "";
          }

          function handleTextGood() {
            // clearCaptcha();

            if (rezultForm) {
              titlePopupCheck.innerHTML =
                "Спасибо за заявку! <br>Скоро с вами свяжется наш консультант!";
              rezultForm.classList.add("opened");

              setTimeout(() => {
                rezultForm.classList.remove("opened");
              }, 3500);
            }

            document.querySelectorAll(".active").forEach((el) => {
              if (el.classList.contains("popup")) {
                el.classList.remove("active");
              }
            });

            clearInputs();
          }

          function handleTextNoGood() {
            clearCaptcha();

            if (rezultForm) {
              titlePopupCheck.innerHTML = "Повторите попытку позже";
              rezultForm.classList.add("opened");

              setTimeout(() => {
                rezultForm.classList.remove("opened");
              }, 3500);
            }
          }

          function handleTextError() {
            clearCaptcha();

            if (rezultForm) {
              titlePopupCheck.innerHTML = "Что-то пошло не так.";
              rezultForm.classList.add("opened");

              setTimeout(() => {
                rezultForm.classList.remove("opened");
              }, 3500);
            }
          }

          let captchaTokenInput = document.createElement("input");
          captchaTokenInput.type = "hidden";
          captchaTokenInput.name = `captcha_token`;

          // Добавляем скрытое поле в начало текущей формы
          form.prepend(captchaTokenInput);

          let captchaInp = form.querySelector(`[name="captcha_token"]`);

          form.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!form.hasAttribute("data-submitted")) {
              form.setAttribute("data-submitted", "true");
              submitButtons.forEach((btn) => {
                btn.disabled = true;
              });
            }

            const isFormValid = validateForm(true);

            if (!isFormValid) {
              syncSubmitButtonsState();
              return;
            }

            // if (!captchaInp.value) {
            //   addLoad();
            //   handleCaptcha(form.querySelector("[type='submit']"), captchaInp);
            //   window.smartCaptcha.execute(widgetId);
            //   removeLoad();
            //   return;
            // } else {
            //   addLoad();
            //   let formData = new FormData(form);
            //   fetch("/local/templates/main/tools/send.php", {
            //     method: "POST",
            //     body: formData,
            //   })
            //     .then((res) => res.json())
            //     .then((result) => {
            //       if (result.success) {
            //         removeLoad();
            //         handleTextGood();
            //       } else {
            //         removeLoad();
            //         handleTextNoGood();
            //       }
            //     })
            //     .catch((err) => {
            //       removeLoad();
            //       handleTextError();
            //     });
            // }

            handleTextGood();

            // После успешной валидации сбрасываем "режим показа ошибок".
            form.removeAttribute("data-submitted");
            submitButtons.forEach((btn) => {
              btn.disabled = false;
            });
            requiredFields.forEach((field) => {
              const config = getErrorConfig(field);
              if (config.errorTarget) {
                config.errorTarget.classList.remove(config.classToAdd);
              }
            });
          });
        }
      });
    }
  }

  window.initAjaxForms = function () {
    handleForms();
  };

  handleForms();
  // Конец скрипта: обработчики кликов на форме

  if (document.getElementById("isAdmin")) {
    console.log("index.js finish work");
  }
});
