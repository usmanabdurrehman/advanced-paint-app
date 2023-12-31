import { ChakraProvider } from "@chakra-ui/react";
import { Paint } from "./Components";

export default function App() {
  return (
    <ChakraProvider>
      <Paint />
    </ChakraProvider>
  );
}
