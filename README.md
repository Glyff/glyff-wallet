# glyff-wallet

[![Join the chat at https://gitter.im/Glyff/glyff-wallet](https://badges.gitter.im/Glyff/glyff-wallet.svg)](https://gitter.im/Glyff/glyff-wallet?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Glyff Wallet

#### Build Setup

```bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn dev

# build electron application for production
yarn build

# lint all JS/Vue component files in `src/`
yarn lint

```

---

### Testing

To run tests first make sure that: 
 - Correct contract address is added to `src/config/index.js`
 - Correct node host and port added to `src/config/index.js`
 - Correct glyff address with password added here `tests/config.js`
 - Make sure that local test node is mining and is used only for current wallet

To run all tests
```bash
yarn test
```

To run some specific test
```bash
yarn test 'shield unshield'
```
