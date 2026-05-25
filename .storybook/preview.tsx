import type { Preview } from "@storybook/react";
import { View } from "react-native";
import "../src/global.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story) => (
      <View className="flex-1 p-4 bg-white dark:bg-black">
        <Story />
      </View>
    ),
  ],
};

export default preview;
