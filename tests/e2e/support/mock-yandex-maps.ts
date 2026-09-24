import type { Page } from '@playwright/test';

const YANDEX_MAPS_STUB = String.raw`
(() => {
  const controlsModule = { __parktrackModule: 'controls' };

  function createReactify(React) {
    const Empty = () => null;
    const Container = ({ children }) => React.createElement(React.Fragment, null, children);
    const Marker = ({ children }) =>
      React.createElement('div', { className: 'ymaps3-stub-marker' }, children);
    const Control = ({ children }) => React.createElement('button', { type: 'button' }, children);
    const Map = React.forwardRef(function YandexMapStub({ children, location }, ref) {
      const locationRef = React.useRef(location);
      locationRef.current = location;

      React.useImperativeHandle(
        ref,
        () => ({
          update(next) {
            locationRef.current = { ...locationRef.current, ...next };
          },
          setLocation(next) {
            locationRef.current = { ...locationRef.current, ...next };
          },
          get zoom() {
            return locationRef.current?.zoom ?? 15;
          },
          zoomRange: { min: 0, max: 21 },
        }),
        [],
      );

      return React.createElement(
        'div',
        {
          className: 'ymaps3-stub',
          'data-testid': 'yandex-map-stub',
          style: { position: 'absolute', inset: 0 },
        },
        children,
      );
    });

    const core = {
      YMap: Map,
      YMapDefaultSchemeLayer: Empty,
      YMapDefaultFeaturesLayer: Empty,
      YMapFeature: Empty,
      YMapMarker: Marker,
      YMapListener: Empty,
      YMapFeatureDataSource: Container,
      YMapLayer: Empty,
      YMapControls: Container,
      YMapControlButton: Control,
    };
    const controls = {
      YMapZoomControl: Empty,
      YMapGeolocationControl: Empty,
      YMapRotateTiltControl: Empty,
    };

    return {
      module(value) {
        return value?.__parktrackModule === 'controls' ? controls : core;
      },
      useDefault(value) {
        return value;
      },
    };
  }

  const importPackage = async (packageName) => {
    if (packageName === '@yandex/ymaps3-reactify') {
      return {
        reactify: {
          bindTo(React) {
            return createReactify(React);
          },
        },
      };
    }
    if (packageName === '@yandex/ymaps3-default-ui-theme') return controlsModule;
    return {};
  };
  importPackage.registerCdn = () => {};

  window.ymaps3 = {
    __parktrackModule: 'core',
    ready: Promise.resolve(),
    import: importPackage,
    search: async () => [],
  };
})();
`;

export async function mockYandexMaps(page: Page): Promise<void> {
  // The app starts MSW before rendering. A service worker handles requests
  // before Playwright's page.route(), so routing the SDK URL here would let an
  // unhandled MSW request reach Yandex with the fake CI key. Install the shim
  // before any application script instead; loadYmaps() then sees ymaps3 and
  // never creates the external SDK script element.
  await page.addInitScript({ content: YANDEX_MAPS_STUB });
}
