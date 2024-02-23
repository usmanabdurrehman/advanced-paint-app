import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  RangeSlider,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  RangeSliderTrack,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { DiamondHalf } from "react-bootstrap-icons";
import { ImageFilters as ImageFiltersType } from "../../types";

interface ImageFiltersProps {
  filters: ImageFiltersType;
  onFilterChange: React.Dispatch<React.SetStateAction<ImageFiltersType>>;
  stageRef: any;
}

export const ImageFilters = ({
  filters,
  onFilterChange,
  stageRef,
}: ImageFiltersProps) => {
  return (
    <Popover>
      <PopoverTrigger>
        <IconButton size="sm" icon={<DiamondHalf />} aria-label="Filters" />
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />

        <Box p={4}>
          <Text fontSize="x-large">Image Filters</Text>
          <Divider mt={2} mb={2} />
          <FormControl>
            <FormLabel>Brightness</FormLabel>
            <RangeSlider
              aria-label={["min", "max"]}
              min={-1}
              max={1}
              step={0.01}
              value={[filters.brightness]}
              onChange={([value]) => {
                const images = stageRef?.current?.find(".image");

                images?.forEach((image: any) => {
                  image?.cache();
                  image?.saturation(value);
                });

                onFilterChange({ ...filters, brightness: value });
              }}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
            </RangeSlider>
          </FormControl>
          <FormControl>
            <FormLabel>Blur</FormLabel>
            <RangeSlider
              aria-label={["min", "max"]}
              min={0}
              max={40}
              step={2}
              value={[filters.blur]}
              onChange={([value]) => {
                const images = stageRef?.current?.find(".image");

                images?.forEach((image: any) => {
                  image?.cache();
                  image?.blurRadius(value);
                });

                onFilterChange({ ...filters, blur: value });
              }}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
            </RangeSlider>
          </FormControl>
          <FormControl>
            <FormLabel>Saturation</FormLabel>
            <RangeSlider
              aria-label={["min", "max"]}
              min={-2}
              max={10}
              step={0.01}
              value={[filters.saturation]}
              onChange={([value]) => {
                const images = stageRef?.current?.find(".image");

                images?.forEach((image: any) => {
                  image?.cache();
                  image?.saturation(value);
                });

                onFilterChange({ ...filters, saturation: value });
              }}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
            </RangeSlider>
          </FormControl>
          <FormControl>
            <FormLabel>Hue</FormLabel>
            <RangeSlider
              aria-label={["min", "max"]}
              min={0}
              max={259}
              step={1}
              value={[filters.hue]}
              onChange={([value]) => {
                const images = stageRef?.current?.find(".image");

                images?.forEach((image: any) => {
                  image?.cache();
                  image?.hue(value);
                });

                onFilterChange({ ...filters, hue: value });
              }}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
            </RangeSlider>
          </FormControl>
        </Box>
      </PopoverContent>
    </Popover>
  );
};
