import "./css/style.css";
import "./css/typography.css";

const colors = ["#3674B5", "#FBA518", "#5B913B", "#BE3144"];

const randomAnchorColor = () =>
  colors[Math.floor(Math.random() * colors.length)];
const setRandomAnchorColor = () => {
  document.documentElement.style.setProperty(
    "--anchor-color",
    randomAnchorColor()
  );
};

window.addEventListener("load", () => {
  setRandomAnchorColor();
});
