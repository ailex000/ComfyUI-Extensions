import { app } from "/scripts/app.js";
import { $el, ComfyDialog } from "/scripts/ui.js";

var styles = `
.comfy-carousel {
    display: none; /* Hidden by default */
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0%;
    left: 0%;
    justify-content: center;
    align-items: center;
    background: rgba(0,0,0,0.8);
    z-index: 9999;
}

.comfy-carousel-box {
    margin: 0 auto 20px;
    text-align: center;
}

.comfy-carousel-box .slides {
    position: relative;
}

.comfy-carousel-box .slides img {
    display: none;
    max-height: 90vh;
    max-width: 90vw;
    margin: auto;
}

.comfy-carousel-box .slides img.shown {
    display: block;
}

.comfy-carousel-box .prev:before,
.comfy-carousel-box .next:before {
    color: #fff;
    font-size: 100px;
    position: absolute;
    top: 35%;
    cursor: pointer;
}

.comfy-carousel-box .prev:before {
    content: '❮';
    left: 0;
}

.comfy-carousel-box .next:before {
    content: '❯';
    right: 0;
}

.comfy-carousel-box .dots img {
    height: 32px;
    margin: 8px 0 0 8px;
    opacity: 0.6;
}

.comfy-carousel-box .dots img:hover {
    opacity: 0.8;
}

.comfy-carousel-box .dots img.active {
    opacity: 1;
}
`

var styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = styles
document.head.appendChild(styleSheet)

class ComfyCarousel extends ComfyDialog {
  constructor() {
    super();
    this.element.classList.remove("comfy-modal");
    this.element.classList.add("comfy-carousel");
    this.element.addEventListener('click', (e) => {
      this.close();
    });
    this.onKeydown = this.onKeydown.bind(this);
  }
  createButtons() {
    return [];
  }
  getActive() {
    return this.element.querySelector('.slides > .shown');
  }
  selectImage(slide) {
    let active = this.getActive();
    if (active) {
      active.classList.remove('shown');
      active._dot.classList.remove('active');
    }

    slide.classList.add('shown');
    slide._dot.classList.toggle('active');
  }
  prevSlide(e) {
    let active = this.getActive();
    this.selectImage(active.previousElementSibling || active.parentNode.lastElementChild);
    e.stopPropagation();
  }
  nextSlide(e) {
    let active = this.getActive();
    this.selectImage(active.nextElementSibling || active.parentNode.firstElementChild);
    e.stopPropagation();
  }
  onKeydown(e) {
    if (e.key == "Escape")
      this.close();
    else if (e.key == "ArrowLeft")
      this.prevSlide(e);
    else if (e.key == "ArrowRight")
      this.nextSlide(e);
  }
  show(images, activeIndex) {
    let slides = [];
    let dots = [];
    for (let image of images) {
      let slide = image.cloneNode(true);
      slides.push(slide);

      let dot = image.cloneNode(true);
      dot.addEventListener('click', (e) => {
        this.selectImage(slide);
        e.stopPropagation();
      }, true);
      slide._dot = dot;
      dots.push(dot);

      if (slides.length - 1 == activeIndex)
        this.selectImage(slide);
    }

    const carousel = $el("div.comfy-carousel-box", {  }, [
      $el("div.slides", {  }, slides),
      $el("div.dots", {  }, dots),
      $el("a.prev", { $: (el) => el.addEventListener('click', (e) => this.prevSlide(e)), }),
      $el("a.next", { $: (el) => el.addEventListener('click', (e) => this.nextSlide(e)), }),
    ]);
    super.show(carousel);

    document.addEventListener("keydown", this.onKeydown);
    document.activeElement?.blur();
  }
  close() {
    document.removeEventListener("keydown", this.onKeydown);
    super.close();
  }
}

app.registerExtension({
  name: "Comfy.ImageGallery",
  init() {
    app.ui.carousel = new ComfyCarousel();
  },
  beforeRegisterNodeDef(nodeType, nodeData) {
    function isImageClick(node, pos) {
      // This follows the logic of getImageTop() in ComfyUI
      let imageY;
      if (node.imageOffset)
        imageY = node.imageOffset;
      else if (node.widgets?.length) {
        const widget = node.widgets[node.widgets.length - 1];
        imageY = widget.last_y;
        if (widget.computeSize)
          imageY += widget.computeSize()[1] + 4;
        else if (widget.computedHeight)
          imageY += widget.computedHeight;
        else
          imageY += LiteGraph.NODE_WIDGET_HEIGHT + 4;
      } else
        imageY = node.computeSize()[1];

      return pos[1] >= imageY;
    }

    const origOnDblClick = nodeType.prototype.onDblClick;
    nodeType.prototype.onDblClick = function (e, pos, ...args) {
      if (this.imgs && this.imgs.length && isImageClick(this, pos)) {
        let imageIndex = 0;
        if (this.imageIndex !== null)
          imageIndex = this.imageIndex;
        else if (this.overIndex !== null)
          imageIndex = this.overIndex;
        app.ui.carousel.show(this.imgs, imageIndex);
      }

      if (origOnDblClick)
        origOnDblClick.call(this, e, pos, ...args);
    }
  },
});
