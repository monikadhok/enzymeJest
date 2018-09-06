
import React from 'react';
import { shallow, mount } from 'enzyme';
import Bar from '../Bar';

jest.dontMock('../Bar');
describe('<Bar />', () => {
  
  it('renders a <p> with a static text', () => {
    const wrapper = shallow(<Bar />);
    expect(wrapper.contains(<p>I am not a very smart component...</p>)).toBe(true);
  });

  it('test1', () => {
    const wrapper = mount(<Bar />);
    debugger;
    expect(wrapper.contains(<p>I am not a very smart component...</p>)).toBe(true);
  });
});

