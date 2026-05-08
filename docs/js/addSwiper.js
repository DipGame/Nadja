document.addEventListener("DOMContentLoaded", function () {
  let mainBannerSwiper = new Swiper(".main-banner-swiper", {
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
    loop: true,
    slidesPerView: 1,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    speed: 1000,
    navigation: {
      nextEl: ".main-banner-swiper-arrows .swiper-btn-next",
      prevEl: ".main-banner-swiper-arrows .swiper-btn-prev",
    },
    pagination: {
      el: ".main-banner-swiper .swiper-pagination",
      clickable: true,
    },
  });


  let mainBannerFeaturesSwiper = new Swiper(".main-banner-features-swiper", {
    slidesPerView: "auto",
    spaceBetween: 24,
  });

  let mainDoctorsSwiper = new Swiper(".main-doctors-swiper", {
    loop: true,
    slidesPerView: "auto",
    spaceBetween: 16,
    navigation: {
      nextEl: ".main-doctors-swiper-container .swiper-btn-next",
      prevEl: ".main-doctors-swiper-container .swiper-btn-prev",
    },
    pagination: {
      el: ".main-doctors-swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      501: {
        spaceBetween: 24,
      },
    },
  });

  if (document.querySelector(".main-stocks-swiper")) {
    new Swiper(".main-stocks-swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 16,
      navigation: {
        nextEl: ".main-stocks-swiper-container .swiper-btn-next",
        prevEl: ".main-stocks-swiper-container .swiper-btn-prev",
      },
      pagination: {
        el: ".main-stocks-swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        501: {
          spaceBetween: 24,
        },
      },
    });
  }

  if (document.querySelector(".diag-oborud-swiper")) {
    new Swiper(".diag-oborud-swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 16,
      navigation: {
        nextEl: ".diag-oborud-swiper-container .swiper-btn-next",
        prevEl: ".diag-oborud-swiper-container .swiper-btn-prev",
      },
      pagination: {
        el: ".diag-oborud-swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        501: {
          spaceBetween: 24,
        },
      },
    });
  }

  if (document.querySelector(".main-gallery-swiper")) {
    new Swiper(".main-gallery-swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 16,
      centeredSlides: true,

      navigation: {
        nextEl: ".main-gallery-swiper-container .swiper-btn-next",
        prevEl: ".main-gallery-swiper-container .swiper-btn-prev",
      },
      pagination: {
        el: ".main-gallery-swiper-pagination",
        clickable: true,
      },

      breakpoints: {
        501: {
          spaceBetween: 24,
          centeredSlides: false,
        },
      },

    });
  }

  if (document.querySelector(".main-reviews__swiper")) {
    new Swiper(".main-reviews__swiper", {
      loop: true,
      slidesPerView: "auto",
      spaceBetween: 16,
      pagination: {
        el: ".main-reviews__swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        501: {
          spaceBetween: 24,
        },
      },
    });
  }

  if (document.getElementById("isAdmin")) {
    console.log("addSwiper.js finish work");
  }
});
