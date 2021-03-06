import { accept as select, UniversalElementSelector } from '@compactjs/uea';
import { PropertiesHyphen } from 'csstype';
import { between, map } from './utils';

type StyleDefinition = {
	[key in keyof PropertiesHyphen<string>]: string;
};

/**
 * Creates a transitional object
 * @param element
 * @param duration duration in frames
 */
export function Transition(
	selector: UniversalElementSelector,
	duration: number
): TransitionAPI {
	const keyFrames: Keyframe[] = [];
	let currentFrame = 0;
	let outOfFrame = false;
	const update = () => {
		const styles: StyleDefinition = {};
		keyFrames.forEach((keyframe) => {
			const properties = keyframe.css;
			if (
				between(
					currentFrame,
					duration * keyframe.start,
					duration * keyframe.end
				)
			) {
				properties.forEach((prop) => {
					const newValue = map(
						currentFrame,
						duration * keyframe.start,
						duration * keyframe.end,
						prop.sourceValue,
						prop.targetValue
					);
					if (styles[prop.propertyName] === undefined)
						styles[prop.propertyName] = '';
					styles[prop.propertyName] += prop.computedValue(newValue) + ' ';
				});
			} else {
				properties.forEach((prop) => {
					const newValue =
						currentFrame < duration * keyframe.start
							? prop.sourceValue
							: prop.targetValue;
					if (styles[prop.propertyName] === undefined)
						styles[prop.propertyName] = '';
					styles[prop.propertyName] += prop.computedValue(newValue) + ' ';
				});
			}
		});
		select(selector).forEach((el) => applyStyles(el, styles));
	};
	return {
		addKeyframe(cssProperties, start, end) {
			keyFrames.push({
				css: cssProperties,
				start,
				end,
			});
			return this;
		},
		next() {
			if (currentFrame < duration) {
				currentFrame++;
				requestAnimationFrame(update);
			}
		},
		previous() {
			if (currentFrame > 0) {
				currentFrame--;
				requestAnimationFrame(update);
			}
		},
		set(frame) {
			if (between(frame, 0, duration)) {
				currentFrame = frame;
				requestAnimationFrame(update);
				outOfFrame = false;
			} else {
				if (!outOfFrame) {
					currentFrame = frame;
					requestAnimationFrame(update);
					outOfFrame = true;
				}
			}
		},
	};
}

function applyStyles(element: HTMLElement, styles: StyleDefinition) {
	Object.entries(styles).forEach(([prop, style]) => {
		if (style !== undefined) element.style.setProperty(prop, style);
	});
}

interface TransitionAPI {
	/**
	 *	Add transition keyframe with CSS properties
	 * @param cssProperties Definitions for transitioning CSS properties
	 * @param start keyframe starting point in percent (beween 0 and 1)
	 * @param end keyframe end point in percent (beween 0 and 1)
	 * @returns TransitionAPI for chaining
	 */
	addKeyframe(
		cssProperties: PropertyDefinition[],
		start: number,
		end: number
	): TransitionAPI;
	/**
	 * draw next frame
	 */
	next(): void;
	/**
	 * draw previous frame
	 */
	previous(): void;
	/**
	 * draw specific frame
	 * @param frame frame number
	 */
	set(frame: number): void;
}

/**
 * Defines how a CSS property is transitioned
 */
export type PropertyDefinition = {
	/**
	 * css property name
	 * @example opacity
	 */
	propertyName: keyof PropertiesHyphen<string>;
	/**
	 * defines how a css property value is generated
	 */
	computedValue: (newValue: number) => string;
	/**
	 * starting css value
	 */
	sourceValue: number;
	/**
	 * target css value
	 */
	targetValue: number;
};
interface Keyframe {
	css: PropertyDefinition[];
	start: number;
	end: number;
}
