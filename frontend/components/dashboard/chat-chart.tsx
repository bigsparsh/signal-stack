"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export interface ChartData {
  type: "chart";
  chartType: "bar" | "line" | "pie";
  title: string;
  data: { name: string; value: number }[];
  description?: string;
}

// Using theme chart colors for consistency with shadcn
const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ChatChart({ chartData }: { chartData: ChartData }) {
  const { chartType, title, data, description } = chartData;

  const chartConfig: ChartConfig = {
    value: {
      label: "Value",
      color: "var(--chart-1)",
    },
    ...Object.fromEntries(
      data.map((item, index) => [
        item.name,
        {
          label: item.name,
          color: CHART_COLORS[index % CHART_COLORS.length],
        },
      ])
    ),
  };

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart accessibilityLayer data={data} margin={{ top: 20, left: 0, right: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={35}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar
                dataKey="value"
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        );
      case "line":
        return (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ top: 20, left: 10, right: 20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.4} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                width={35}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ fill: "var(--color-value)", r: 4, strokeWidth: 2, stroke: "var(--background)" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        );
      case "pie":
        return (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                strokeWidth={5}
                stroke="var(--background)"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        );
      default:
        return <div>Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <Card className="mt-4 border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-4 pt-4 text-center">
        <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pb-4">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
