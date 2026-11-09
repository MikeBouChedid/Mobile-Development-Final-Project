# CampusGo – Antonine Campus Delivery

CampusGo is a React Native (Expo) app for the students and staff of Université Antonine. You can order from the campus stores (Cafeteria, Coffee Corner, Bookstore & Stationery, Printing Office) and have the order delivered to a building and room during a class break.

Course: Mobile Development – PROG421-EC10

---

## 1. How to run

Requirements: Node.js, plus the **Expo Go** app on your phone (or an Android emulator).

```bash
cd CampusGo
npm install
npx expo start
```

* **Phone:** scan the QR code with Expo Go (Android) or the Camera app (iPhone). The phone and the computer must be on the same Wi-Fi.
* **Android emulator:** press `a` in the terminal.
* **Browser preview (quick check only):** press `w`.

### Demo account
| Email | Password |
|---|---|
| `demo@ua.edu.lb` | `demo1234` |

The login screen also has a **"Use the demo account"** button that fills these in. You can also create your own account with Sign up.

---

## 2. User guide

### Screen 1 – Welcome / Login / Sign up
* Log in with a university email. It must end with `@ua.edu.lb`.
* **Sign up** asks for: full name, email, student/staff ID (8 digits), faculty, Lebanese phone number (e.g. `70123456`) and a password (at least 6 characters, entered twice).
* Every field is validated and shows a clear error message under it.

### Screen 2 – Home (Campus stores)
* Lists the 4 stores with logo, category, prep time and opening hours.
* The **Open / Closed** badge is calculated live from the opening hours and the current time.
* The **search bar** and the **category chips** (Food, Drinks, Stationery, Printing) filter the list.
* The blue banner shows the **next available delivery slot** and your **wallet balance**.
* Pull down to refresh.

### Screen 3 – Store menu & product details
* Products are grouped by category (Sandwiches, Hot Drinks, Notebooks…). Chips at the top filter by category.
* Tap **+** to add a product quickly, or tap the product to open its details. There you can pick a **size**, **extras** and the **quantity**, and the price updates live.
* **Out-of-stock** products are shown greyed out and cannot be added.
* The cart icon in the header shows how many items you have.
* **One store per cart:** adding a product from a different store asks you to empty the cart first.
* You can browse a closed store's menu, but you can't order from it.

### Screen 4 – Printing service (Print tab)
* Tap the upload box to choose a document (the upload is simulated). This fills in the page count.
* Choose the pages, copies, B&W or color, single or double-sided, and binding (none / staple / spiral).
* The price is recalculated every time an option changes:
  * B&W $0.05/page, color $0.25/page
  * double-sided −10 %
  * staple +$0.25, spiral +$1.50 (per copy)
* Validation: pages and copies must be > 0, with at most 200 pages.
* **Add to cart** puts the job in the Printing Office cart.

### Screen 5 – Cart & checkout
* **Cart:** change quantities with + / −, remove items, and see the subtotal, delivery fee and total.
  * Delivery is **free from $10**, otherwise **$0.50**.
  * The **minimum order is $2**.
* **Checkout:**
  * **Location:** choose a building (6 buildings) and type the room number (required). Saved locations fill both in with one tap, and a switch saves the new location to your profile.
  * **Time:** choose a class break slot. A slot is disabled if it has already started (**Passed**) or if the store doesn't have time to prepare the order before it (**Too soon**).
  * **Payment:** Campus Wallet or cash on delivery. Wallet payment is refused if the balance is too low.
  * A confirmation dialog shows the summary before the order is placed.

### Screen 6 – Order tracking
* Timeline: **Received → Preparing → On the way → Delivered to Building X, Room Y**.
* The status changes automatically every few seconds, driven by a timer in `useEffect` with cleanup.
* Shows the courier name, the estimated delivery time (the chosen break), the items and the payment.
* **Cancel** is only available while the order is "Received". Wallet payments are refunded.
* After delivery, you can **rate** the order from 1 to 5 stars and leave a comment.

### Screen 7 – Orders, Profile & Wallet
* **Orders tab:** all your past orders with date, store, total and status. You can filter by status (All / Active / Delivered / Cancelled) and by store. **Reorder** copies an order back into the cart.
* **Profile tab:** name, ID, faculty and phone. Here you can add or delete **saved delivery locations** (e.g. "My Lab – Building B, Room 204") and log out.
* **Wallet** (from the Profile tab): shows the balance, a simulated top-up ($5 / $10 / $20 / $50 or a custom amount) and the list of transactions (top-ups, payments, refunds).
* New accounts start with a **$20 welcome balance**.

### Demo clock (for the presentation)
Store hours and delivery slots depend on the real time. If you present at night, every store would show as closed. Turn on **Profile → Demo clock** and pick a time (e.g. 09:00) so the app behaves as if it were that time of day. Turn it off to go back to the real clock.

---

## 3. Project structure

```
CampusGo/
├── App.js                      # SafeAreaProvider + AppProvider + NavigationContainer
├── assets/logo.png
└── src/
    ├── data/campus.json        # mock data: 4 stores, 33 products, 6 buildings, 6 slots, print prices
    ├── api/campusApi.js        # mock API (async functions; can switch to json-server)
    ├── context/AppContext.js   # global state: user, cart, wallet, orders + AsyncStorage
    ├── navigation/AppNavigator.js  # stack navigator + bottom tabs
    ├── hooks/useAddToCart.js   # "one store per cart" rule
    ├── utils/
    │   ├── time.js             # opening hours, delivery slots
    │   ├── pricing.js          # product price, print price, delivery fee, minimum order
    │   ├── validation.js       # login, sign-up and print forms
    │   └── dialogs.js          # Alert on phone / confirm on web
    ├── components/             # AppButton, FormInput, Chip, OpenBadge, StoreCard, ProductRow,
    │                           # QuantitySelector, CartButton, StarRating, Section, EmptyState, Icon
    └── screens/                # Welcome, SignUp, Home, StoreMenu, ProductDetails, Print,
                                # Cart, Checkout, Tracking, Orders, Profile, Wallet
```

### Course concepts used
| Concept (chapter) | Where |
|---|---|
| Functional components, props, destructuring | every component in `src/components` |
| `map` + `key` | option chips, order items, timeline |
| `useState` | all forms, filters, quantity, rating |
| `useEffect` + cleanup | loading data, live clock, order status timer, "updated Xs ago" timer, toast timer |
| Conditional rendering (`&&`, ternary) | Open/Closed, out of stock, cancel/rate buttons, empty states |
| Events (`onPress`, `onChangeText`) | everywhere |
| StyleSheet & Flexbox | every screen |
| View, Text, Image, TextInput, ScrollView, Switch, Modal, Pressable, ActivityIndicator | screens |
| **FlatList** (incl. horizontal, header/footer/empty, RefreshControl) | stores, products, cart, orders, transactions, locations, files |
| async / await, Promises, fetch | `campusApi.js`, login/sign-up, checkout loading |
| React Navigation: native stack + bottom tabs, `navigate`, `route.params`, `replace`, `goBack`, `setOptions`, tab badge | `AppNavigator.js` and screens |
| AsyncStorage | users, session, cart, wallet, orders, saved locations, demo clock |

### Using json-server instead of the local JSON file (optional)
```bash
npx json-server src/data/campus.json --port 3000
```
Then set `API_URL` in `src/api/campusApi.js` to `http://<your-computer-IP>:3000`.

---

## 4. Business rules summary
| Rule | Value |
|---|---|
| Email domain | `@ua.edu.lb` |
| Student/staff ID | 8 digits |
| Password | ≥ 6 characters |
| Minimum order | $2.00 |
| Delivery fee | $0.50, free from $10.00 |
| Cart | one store only |
| Closed store | cannot order / check out |
| Delivery slot | disabled if passed or if now + store prep time > slot start |
| Wallet | payment refused if balance < total; refund on cancel |
| Cancel | only while status is "Received" |
| Rating | only after "Delivered" |
| Printing | pages > 0, copies > 0, max 200 pages |

> No real backend, payment or GPS: login, payments, uploads and tracking are simulated, and data is stored on the phone with AsyncStorage.
