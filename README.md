# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

## Notes

- winner should be displayed clearly
  - stats
  - confetti?
- score display left and right should be neater
- should display game config
- sounds?
- speed + increment needs to be a little faster
- add undo functionality
- keep path of ball
- scoreboard
- pause
- landing page
- keyboard input
- ability to reset / play again
- maybe make the serve follow have more momentum?
- paint a net on the screen?
- fast balls should leave marks on the screen?

# Testing

- tie break score not correct in main game score
- tie break seemed to go to eight
- incorrectly said it was set point when it wasn't
- didn't say set point when it was (tie break)
- should announce tie break as an event
- when controller lost contact half way through it didnt pause that great
