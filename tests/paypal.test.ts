import { generateAccessToken, paypal } from "../lib/paypal";

// test to generate access token from paypal
test("generate access token from paypal", async () => {
  const token = await generateAccessToken();
  console.log(token);
  expect(typeof token).toBe("string");
  expect(token.length).toBeGreaterThan(0);
});

// test to create a paypal order
test("create a paypal order", async () => {
  const price = 10.0;
  const order = await paypal.createOrder(price);
  console.log(order);
  expect(order).toHaveProperty("id");
  expect(order).toHaveProperty("status");
  expect(order.status).toBe("CREATED");
});

// test to capture a paypal payment with a mock order
test("simulate capturing a paypal payment for an order", async () => {
  const orderId = "100";

  const mockCapturePayment = jest
    .spyOn(paypal, "capturePayment")
    .mockResolvedValue({
      status: "COMPLETED",
    });
  const payment = await paypal.capturePayment(orderId);
  console.log(payment);
  expect(payment).toHaveProperty("status", "COMPLETED");

  mockCapturePayment.mockRestore();
});
