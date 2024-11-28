import "./style.css";
import typescriptLogo from "./typescript.svg";
import { setupCounter } from "../lib/main";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
   <button id="checkIn" type="button">签入</button>
   <button id="call" type="button">接听</button>
   <button id="outbound" type="button">外呼</button>
  </div>
`;

document
  .querySelector<HTMLButtonElement>("#checkIn")
  ?.addEventListener("click", () => {
    console.log("111111");
  });
document
  .querySelector<HTMLButtonElement>("#call")
  ?.addEventListener("click", () => {
    console.log("2222");
  });
document
  .querySelector<HTMLButtonElement>("#outbound")
  ?.addEventListener("click", () => {
    console.log("3333");
  });
