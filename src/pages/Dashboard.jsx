import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card.jsx";

// Define the primary tools for the dashboard
const tools = [
  {
    title: "Serial Dilution Calculator",
    description: "Quickly calculate serial dilutions",
    route: "/calculators-tools/serial-dilution-calculator",
    category: "calculator",
    icon: "calculator",
    popular: true,
  },
  {
    title: "qPCR Protocol",
    description: "Design and review qPCR protocols",
    route: "/assays/qpcr",
    category: "protocol",
    icon: "dna",
    popular: true,
  },
  {
    title: "Plate Map Generator",
    description: "Create and manage plate maps",
    route: "/calculators-tools/plate-map-generator",
    category: "tool",
    icon: "grid",
    popular: true,
  },
];

export default function Dashboard() {
  const [lastRoute, setLastRoute] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("lastRoute");
    // Only set valid routes that aren't the dashboard itself
    if (saved && saved !== "/" && saved !== "") {
      setLastRoute(saved);
    }
  }, []);

  return (
    <div className="pt-6 pb-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {lastRoute && (
          <Card>
            <CardHeader>
              <CardTitle>Continue where you left off</CardTitle>
              <CardDescription>Go back to your last tool</CardDescription>
            </CardHeader>
            <CardAction>
              <Link to={lastRoute} className="text-blue-600 hover:underline">
                Continue
              </Link>
            </CardAction>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Popular Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card key={tool.route} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardAction>
                  <Link
                    to={tool.route}
                    className="text-blue-600 hover:underline flex items-center"
                  >
                    Open <span className="ml-1">→</span>
                  </Link>
                </CardAction>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
