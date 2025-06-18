import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "./index";
import { ReactQueryProvider } from "@/contexts/ReactQueryProvider";
import fetchMock from "jest-fetch-mock";

// Мокаем AuthContext и next/navigation аналогично unit-тестам
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false, logout: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Header E2E", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({ title: "Блог", tagline: "Записки…" }),
    );
  });

  it("отображает заголовок и описание", async () => {
    render(
      <ReactQueryProvider>
        <Header />
      </ReactQueryProvider>,
    );
    expect(await screen.findByText("Блог")).toBeInTheDocument();
    expect(await screen.findByText("Записки…")).toBeInTheDocument();
  });
});
