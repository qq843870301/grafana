import React, { FunctionComponent, Fragment, useState, useEffect } from 'react';
import isEqual from 'lodash/isEqual';
import { SelectableValue } from '@grafana/data';
import { SegmentAsync } from '@grafana/ui';

export interface Props {
  dimensions: { [key: string]: string | string[] };
  onChange: (dimensions: { [key: string]: string }) => void;
  loadValues: (key: string) => Promise<Array<SelectableValue<string>>>;
  loadKeys: () => Promise<Array<SelectableValue<string>>>;
}

const removeText = '-- remove dimension --';
const removeOption: SelectableValue<string> = { label: removeText, value: removeText };

// The idea of this component is that is should only trigger the onChange event in the case
// there is a complete dimension object. E.g, when a new key is added is doesn't have a value.
// That should not trigger onChange.
export const Dimensions: FunctionComponent<Props> = ({ dimensions, loadValues, loadKeys, onChange }) => {
  const [data, setData] = useState(dimensions);

  useEffect(() => {
    const completeDimensions = Object.entries(data).reduce(
      (res, [key, value]) => (value ? { ...res, [key]: value } : res),
      {}
    );
    if (!isEqual(completeDimensions, dimensions)) {
      onChange(completeDimensions);
    }
  }, [data]);

  const excludeUsedKeys = (options: Array<SelectableValue<string>>) => {
    return options.filter(({ value }) => !Object.keys(data).includes(value));
  };

  return (
    <>
      {Object.entries(data).map(([key, value], index) => (
        <Fragment key={index}>
          <SegmentAsync
            value={key}
            loadOptions={() => loadKeys().then(keys => [removeOption, ...excludeUsedKeys(keys)])}
            onChange={newKey => {
              const { [key]: value, ...newDimensions } = data;
              if (newKey === removeText) {
                setData({ ...newDimensions });
              } else {
                setData({ ...newDimensions, [newKey]: '' });
              }
            }}
          />
          <label className="gf-form-label query-segment-operator">=</label>
          <SegmentAsync
            allowCustomValue
            value={value || 'select dimension value'}
            loadOptions={() => loadValues(key)}
            onChange={newValue => setData({ ...data, [key]: newValue })}
          />
          {Object.values(data).length > 1 && index + 1 !== Object.values(data).length && (
            <label className="gf-form-label query-keyword">AND</label>
          )}
        </Fragment>
      ))}
      {Object.values(data).every(v => v) && (
        <SegmentAsync
          Component={
            <a className="gf-form-label query-part">
              <i className="fa fa-plus" />
            </a>
          }
          loadOptions={() => loadKeys().then(excludeUsedKeys)}
          onChange={(newKey: string) => setData({ ...data, [newKey]: '' })}
        />
      )}
    </>
  );
};