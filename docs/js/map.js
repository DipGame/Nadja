document.addEventListener("DOMContentLoaded", function () {
  // Настройки текста на метках/balloon — меняйте здесь.
  const MAP_TEXT_CONFIG = {
    balloonHeaderFontSizePx: 16,
    balloonHeaderFontWeight: 600,
    hintFontSizePx: 14,
    hintFontWeight: 500,
  };

  const mapSection = document.querySelector("[data-map]");
  if (mapSection && document.querySelector("#map") && window.ymaps) {
    ymaps.ready(initMapWithBranches);
  }

  const contactsSection = document.querySelector("[data-contacts-map]");
  if (contactsSection && document.querySelector("#contacts-map") && window.ymaps) {
    ymaps.ready(initContactsMapWithTabs);
  }

  function initMapWithBranches() {
    const select = mapSection.querySelector("[data-select]");
    const infoBlocks = Array.from(
      mapSection.querySelectorAll("[data-select-content]"),
    );
    if (!select) {
      return;
    }

    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="37" height="73" viewBox="0 0 37 73" fill="none">
<path d="M18.0359 72.5248L37 53L29.1827 20.5248H6.88911L0 53L18.0359 72.5248Z" fill="#2C6EB5"/>
<path d="M3.92199e-05 0H37L37 53H0L3.92199e-05 0Z" fill="#2C6EB5"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.47656 5.59961H31.5477V35.1486H22.9683C22.9683 35.1486 33.5496 25.928 26.7337 17.3545C20.2037 9.21235 6.47656 5.59961 6.47656 5.59961Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.81405 35.9572C2.95045 27.3837 13.5795 18.1631 13.5795 18.1631H5V47.7121H30.0235C30.0235 47.7121 16.2963 44.0994 9.81405 35.9572Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.299 30.727C22.0644 22.7466 26.4495 19.6191 26.4495 19.6191C26.4495 19.6191 21.3971 21.2368 17.5363 27.7074C14.1999 26.5211 10.1484 27.7613 10.1484 27.7613C10.1484 27.7613 16.2971 28.8937 18.299 30.727Z" fill="white"/>
</svg>`;

    const iconImageHref = "data:image/svg+xml;base64," + btoa(svgIcon);
    const branchOptions = Array.from(select.options).filter(function (option) {
      return option.value && option.dataset.mapLat && option.dataset.mapLng;
    });

    if (!branchOptions.length) {
      return;
    }

    const branches = branchOptions.map(function (option) {
      return {
        id: option.value,
        name: option.textContent.trim(),
        coords: [Number(option.dataset.mapLat), Number(option.dataset.mapLng)],
        option: option,
      };
    });

    const map = new ymaps.Map(
      "map",
      {
        center: branches[0].coords,
        zoom: 11,
        controls: [],
      },
      {
        geoObjectOpenBalloonIconLayout: "default#image",
        suppressMapOpenBlock: true,
      },
    );

    const placemarksById = {};
    const coordFirstBranchId = {};

    function getStyledTextHtml(text, fontSizePx, fontWeight) {
      return `<span style="font-size:${fontSizePx}px;font-weight:${fontWeight};line-height:1.3;">${text}</span>`;
    }

    function showInfoByBranchId(branchId) {
      infoBlocks.forEach(function (block) {
        const isActive = block.getAttribute("data-select-content") === branchId;
        block.classList.toggle("invise", !isActive);
      });
    }

    function activateBranch(branchId, source) {
      if (!branchId) {
        return;
      }
      const branch = branches.find(function (item) {
        return item.id === branchId;
      });
      if (!branch) {
        return;
      }

      showInfoByBranchId(branchId);
      if (select.value !== branchId) {
        select.value = branchId;
      }

      const placemark = placemarksById[branchId];
      if (!placemark) {
        return;
      }

      const openPlacemarkBalloon = function () {
        // Для дублей координат: в select показываем выбранный филиал,
        // при клике по метке — филиал, который связан с текущим branchId.
        placemark.properties.set(
          "balloonContentHeader",
          getStyledTextHtml(
            branch.name,
            MAP_TEXT_CONFIG.balloonHeaderFontSizePx,
            MAP_TEXT_CONFIG.balloonHeaderFontWeight,
          ),
        );
        placemark.properties.set(
          "hintContent",
          getStyledTextHtml(
            branch.name,
            MAP_TEXT_CONFIG.hintFontSizePx,
            MAP_TEXT_CONFIG.hintFontWeight,
          ),
        );

        // При выборе из select не даем balloon сдвигать карту автопанорамированием.
        if (source === "select") {
          placemark.balloon.open(undefined, { autoPan: false });
        } else {
          placemark.balloon.open();
        }
      };

      // Сначала доводим карту до нужного центра, затем открываем balloon.
      // Иначе автопереход карты может остановиться раньше, как только точка попадает в видимую область.
      const movePromise = map.panTo(branch.coords, {
        checkZoomRange: true,
        duration: 300,
        flying: true,
      });

      if (movePromise && typeof movePromise.then === "function") {
        movePromise.then(function () {
          map.setZoom(16, { duration: 200 });
          openPlacemarkBalloon();
        });
      } else {
        map.setCenter(branch.coords, 14, { duration: 250 });
        openPlacemarkBalloon();
      }
    }

    branches.forEach(function (branch) {
      const coordKey = `${branch.coords[0]},${branch.coords[1]}`;
      if (!coordFirstBranchId[coordKey]) {
        coordFirstBranchId[coordKey] = branch.id;
      }
    });

    const uniqueCoords = Object.keys(coordFirstBranchId);

    uniqueCoords.forEach(function (coordKey) {
      const firstBranchId = coordFirstBranchId[coordKey];
      const firstBranch = branches.find(function (branch) {
        return branch.id === firstBranchId;
      });
      if (!firstBranch) {
        return;
      }

      const placemark = new ymaps.Placemark(
        firstBranch.coords,
        {
          hintContent: getStyledTextHtml(
            firstBranch.name,
            MAP_TEXT_CONFIG.hintFontSizePx,
            MAP_TEXT_CONFIG.hintFontWeight,
          ),
          balloonContentHeader: getStyledTextHtml(
            firstBranch.name,
            MAP_TEXT_CONFIG.balloonHeaderFontSizePx,
            MAP_TEXT_CONFIG.balloonHeaderFontWeight,
          ),
        },
        {
          iconLayout: "default#image",
          iconImageHref: iconImageHref,
          iconImageSize: [24, 48],
          iconImageOffset: [-12, -24],
        },
      );

      placemark.events.add("click", function () {
        // Для общих координат при клике по точке показываем первый филиал в select.
        activateBranch(firstBranch.id, "map");
      });

      branches.forEach(function (branch) {
        const branchCoordKey = `${branch.coords[0]},${branch.coords[1]}`;
        if (branchCoordKey === coordKey) {
          placemarksById[branch.id] = placemark;
        }
      });

      map.geoObjects.add(placemark);
    });

    select.addEventListener("change", function () {
      activateBranch(select.value, "select");
    });

    showInfoByBranchId("");
  }

  function initContactsMapWithTabs() {
    const tabs = Array.from(
      contactsSection.querySelectorAll("[data-contacts-tab]"),
    );
    const infoBlocks = Array.from(
      contactsSection.querySelectorAll("[data-select-content]"),
    );
    if (!tabs.length || !infoBlocks.length) {
      return;
    }

    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="37" height="73" viewBox="0 0 37 73" fill="none">
<path d="M18.0359 72.5248L37 53L29.1827 20.5248H6.88911L0 53L18.0359 72.5248Z" fill="#2C6EB5"/>
<path d="M3.92199e-05 0H37L37 53H0L3.92199e-05 0Z" fill="#2C6EB5"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M6.47656 5.59961H31.5477V35.1486H22.9683C22.9683 35.1486 33.5496 25.928 26.7337 17.3545C20.2037 9.21235 6.47656 5.59961 6.47656 5.59961Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M9.81405 35.9572C2.95045 27.3837 13.5795 18.1631 13.5795 18.1631H5V47.7121H30.0235C30.0235 47.7121 16.2963 44.0994 9.81405 35.9572Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.299 30.727C22.0644 22.7466 26.4495 19.6191 26.4495 19.6191C26.4495 19.6191 21.3971 21.2368 17.5363 27.7074C14.1999 26.5211 10.1484 27.7613 10.1484 27.7613C10.1484 27.7613 16.2971 28.8937 18.299 30.727Z" fill="white"/>
</svg>`;
    const iconImageHref = "data:image/svg+xml;base64," + btoa(svgIcon);

    const branches = tabs
      .map(function (tab) {
        const id = tab.getAttribute("data-contacts-tab");
        const lat = Number(tab.getAttribute("data-map-lat"));
        const lng = Number(tab.getAttribute("data-map-lng"));
        if (!id || Number.isNaN(lat) || Number.isNaN(lng)) {
          return null;
        }
        return { id: id, coords: [lat, lng] };
      })
      .filter(Boolean);

    if (!branches.length) {
      return;
    }

    const branchById = {};
    branches.forEach(function (branch) {
      branchById[branch.id] = branch;
    });

    const getBranchName = function (branchId) {
      const info = contactsSection.querySelector(
        `[data-select-content="${branchId}"] .main-map-left-content-title`,
      );
      return info ? info.textContent.trim() : branchId;
    };

    const map = new ymaps.Map(
      "contacts-map",
      {
        center: branches[0].coords,
        zoom: 11,
        controls: [],
      },
      {
        geoObjectOpenBalloonIconLayout: "default#image",
        suppressMapOpenBlock: true,
      },
    );

    const placemarksById = {};
    const coordFirstBranchId = {};
    const contactsMapRoot = document.getElementById("contacts-map");
    let activeContactsBranchId = null;

    function getContactsPanOffsetX() {
      // >= 721px: метка в центре правой половины карты (x = 75% ширины).
      // <= 720px: обычный центр (x = 50% ширины).
      if (!contactsMapRoot || window.innerWidth <= 720) {
        return 0;
      }
      return Math.round(contactsMapRoot.getBoundingClientRect().width / 4);
    }

    function getStyledTextHtml(text, fontSizePx, fontWeight) {
      return `<span style="font-size:${fontSizePx}px;font-weight:${fontWeight};line-height:1.3;">${text}</span>`;
    }

    function setActiveTab(branchId) {
      tabs.forEach(function (tab) {
        const isActive = tab.getAttribute("data-contacts-tab") === branchId;
        tab.classList.toggle("active", isActive);
      });
    }

    function showInfoByBranchId(branchId) {
      infoBlocks.forEach(function (block) {
        const isActive = block.getAttribute("data-select-content") === branchId;
        block.classList.toggle("invise", !isActive);
      });
    }

    function activateBranch(branchId, source) {
      if (!branchId || !branchById[branchId]) {
        return;
      }
      activeContactsBranchId = branchId;

      setActiveTab(branchId);
      showInfoByBranchId(branchId);

      const placemark = placemarksById[branchId];
      if (!placemark) {
        return;
      }

      const branchName = getBranchName(branchId);
      const openPlacemarkBalloon = function () {
        placemark.balloon.close();
        placemark.properties.set("balloonContentHeader", titleHtml);
        placemark.properties.set(
          "hintContent",
          getStyledTextHtml(
            branchName,
            MAP_TEXT_CONFIG.hintFontSizePx,
            MAP_TEXT_CONFIG.hintFontWeight,
          ),
        );

        // Для contacts всегда открываем с автоподводом:
        // так title гарантированно виден и при загрузке, и при клике на таб.
        placemark.balloon.open();

        // Стабилизатор для кейсов, когда карта еще "догоняет" анимацию.
        setTimeout(function () {
          placemark.balloon.open();
        }, 180);
      };

      const centerCoords = branchById[branchId].coords;
      const panOffsetX = getContactsPanOffsetX();
      const titleHtml = getStyledTextHtml(
        branchName,
        MAP_TEXT_CONFIG.balloonHeaderFontSizePx,
        MAP_TEXT_CONFIG.balloonHeaderFontWeight,
      );

      const openAfterOffset = function () {
        if (panOffsetX !== 0) {
          const panByResult = map.panBy([panOffsetX, 0], { duration: 250 });
          if (panByResult && typeof panByResult.then === "function") {
            panByResult.then(openPlacemarkBalloon);
          } else {
            setTimeout(openPlacemarkBalloon, 260);
          }
          return;
        }
        openPlacemarkBalloon();
      };

      const zoomThenOpen = function () {
        const zoomResult = map.setZoom(16, { duration: 200 });
        if (zoomResult && typeof zoomResult.then === "function") {
          zoomResult.then(openAfterOffset);
        } else {
          setTimeout(openAfterOffset, 220);
        }
      };

      // Строгая последовательность: panTo -> zoom -> (доп. сдвиг) -> open balloon.
      const movePromise = map.panTo(centerCoords, {
        checkZoomRange: true,
        duration: 300,
        flying: true,
      });

      if (movePromise && typeof movePromise.then === "function") {
        movePromise.then(zoomThenOpen);
      } else {
        map.setCenter(centerCoords, 16, { duration: 250 });
        setTimeout(zoomThenOpen, 260);
      }
    }

    branches.forEach(function (branch) {
      const coordKey = `${branch.coords[0]},${branch.coords[1]}`;
      if (!coordFirstBranchId[coordKey]) {
        coordFirstBranchId[coordKey] = branch.id;
      }
    });

    Object.keys(coordFirstBranchId).forEach(function (coordKey) {
      const firstBranchId = coordFirstBranchId[coordKey];
      const firstBranch = branchById[firstBranchId];
      if (!firstBranch) {
        return;
      }

      const firstBranchName = getBranchName(firstBranchId);
      const placemark = new ymaps.Placemark(
        firstBranch.coords,
        {
          hintContent: getStyledTextHtml(
            firstBranchName,
            MAP_TEXT_CONFIG.hintFontSizePx,
            MAP_TEXT_CONFIG.hintFontWeight,
          ),
          balloonContentHeader: getStyledTextHtml(
            firstBranchName,
            MAP_TEXT_CONFIG.balloonHeaderFontSizePx,
            MAP_TEXT_CONFIG.balloonHeaderFontWeight,
          ),
        },
        {
          iconLayout: "default#image",
          iconImageHref: iconImageHref,
          iconImageSize: [24, 48],
          iconImageOffset: [-12, -24],
        },
      );

      placemark.events.add("click", function () {
        activateBranch(firstBranchId, "map");
      });

      branches.forEach(function (branch) {
        const branchCoordKey = `${branch.coords[0]},${branch.coords[1]}`;
        if (branchCoordKey === coordKey) {
          placemarksById[branch.id] = placemark;
        }
      });

      map.geoObjects.add(placemark);
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const branchId = tab.getAttribute("data-contacts-tab");
        activateBranch(branchId, "tab");
      });
    });

    // По ТЗ: при загрузке активен первый таб.
    const firstTab = tabs[0];
    const firstBranchId = firstTab
      ? firstTab.getAttribute("data-contacts-tab")
      : null;
    if (firstBranchId) {
      activateBranch(firstBranchId, "init");
    }

    let resizeRafId = null;
    window.addEventListener("resize", function () {
      if (!activeContactsBranchId) {
        return;
      }
      if (resizeRafId !== null) {
        cancelAnimationFrame(resizeRafId);
      }
      resizeRafId = requestAnimationFrame(function () {
        activateBranch(activeContactsBranchId, "resize");
      });
    });
  }

  if (document.getElementById("isAdmin")) {
    console.log("map.js finish work");
  }
});
