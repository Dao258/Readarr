import PropTypes from 'prop-types';
import React, { Component } from 'react';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import ConfirmModal from 'Components/Modal/ConfirmModal';
import PageContent from 'Components/Page/PageContent';
import PageContentBody from 'Components/Page/PageContentBody';
import PageToolbar from 'Components/Page/Toolbar/PageToolbar';
import PageToolbarButton from 'Components/Page/Toolbar/PageToolbarButton';
import PageToolbarSection from 'Components/Page/Toolbar/PageToolbarSection';
import Table from 'Components/Table/Table';
import TableBody from 'Components/Table/TableBody';
import TableOptionsModalWrapper from 'Components/Table/TableOptions/TableOptionsModalWrapper';
import TablePager from 'Components/Table/TablePager';
import { align, icons, kinds } from 'Helpers/Props';
import getRemovedItems from 'Utilities/Object/getRemovedItems';
import hasDifferentItems from 'Utilities/Object/hasDifferentItems';
import translate from 'Utilities/String/translate';
import getSelectedIds from 'Utilities/Table/getSelectedIds';
import removeOldSelectedState from 'Utilities/Table/removeOldSelectedState';
import selectAll from 'Utilities/Table/selectAll';
import toggleSelected from 'Utilities/Table/toggleSelected';
import BlocklistRowConnector from './BlocklistRowConnector';

class Blocklist extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      allSelected: false,
      allUnselected: false,
      lastToggled: null,
      selectedState: {},
      isConfirmRemoveModalOpen: false,
      items: props.items
    };
  }

  componentDidUpdate(prevProps) {
    const {
      items
    } = this.props;

    if (hasDifferentItems(prevProps.items, items)) {
      this.setState((state) => {
        return {
          ...removeOldSelectedState(state, getRemovedItems(prevProps.items, items)),
          items
        };
      });

      return;
    }
  }

  //
  // Control

  getSelectedIds = () => {
    return getSelectedIds(this.state.selectedState);
  }

  //
  // Listeners

  onSelectAllChange = ({ value }) => {
    this.setState(selectAll(this.state.selectedState, value));
  }

  onSelectedChange = ({ id, value, shiftKey = false }) => {
    this.setState((state) => {
      return toggleSelected(state, this.props.items, id, value, shiftKey);
    });
  }

  onRemoveSelectedPress = () => {
    this.setState({ isConfirmRemoveModalOpen: true });
  }

  onRemoveSelectedConfirmed = () => {
    this.props.onRemoveSelected(this.getSelectedIds());
    this.setState({ isConfirmRemoveModalOpen: false });
  }

  onConfirmRemoveModalClose = () => {
    this.setState({ isConfirmRemoveModalOpen: false });
  }

  //
  // Render

  render() {
    const {
      isFetching,
      isPopulated,
      isAuthorFetching,
      isAuthorPopulated,
      error,
      items,
      columns,
      totalRecords,
      isRemoving,
      isClearingBlocklistExecuting,
      onClearBlocklistPress,
      ...otherProps
    } = this.props;

    const isAllPopulated = isPopulated && isAuthorPopulated;
    const isAnyFetching = isFetching || isAuthorFetching;

    const {
      allSelected,
      allUnselected,
      selectedState,
      isConfirmRemoveModalOpen
    } = this.state;

    const selectedIds = this.getSelectedIds();

    return (
      <PageContent title={translate('Blocklist')}>
        <PageToolbar>
          <PageToolbarSection>
            <PageToolbarButton
              label={translate('RemoveSelected')}
              iconName={icons.REMOVE}
              isDisabled={!selectedIds.length}
              isSpinning={isRemoving}
              onPress={this.onRemoveSelectedPress}
            />

            <PageToolbarButton
              label={translate('Clear')}
              iconName={icons.CLEAR}
              isSpinning={isClearingBlocklistExecuting}
              onPress={onClearBlocklistPress}
            />
          </PageToolbarSection>

          <PageToolbarSection alignContent={align.RIGHT}>
            <TableOptionsModalWrapper
              {...otherProps}
              columns={columns}
            >
              <PageToolbarButton
                label={translate('Options')}
                iconName={icons.TABLE}
              />
            </TableOptionsModalWrapper>
          </PageToolbarSection>
        </PageToolbar>

        <PageContentBody>
          {
            isAnyFetching && !isAllPopulated &&
              <LoadingIndicator />
          }

          {
            !isAnyFetching && !!error &&
              <div>
                {translate('UnableToLoadBlocklist')}
              </div>
          }

          {
            isAllPopulated && !error && !items.length &&
              <div>
                {translate('NoHistoryBlocklist')}
              </div>
          }

          {
            isAllPopulated && !error && !!items.length &&
              <div>
                <Table
                  selectAll={true}
                  allSelected={allSelected}
                  allUnselected={allUnselected}
                  columns={columns}
                  {...otherProps}
                  onSelectAllChange={this.onSelectAllChange}
                >
                  <TableBody>
                    {
                      items.map((item) => {
                        return (
                          <BlocklistRowConnector
                            key={item.id}
                            isSelected={selectedState[item.id] || false}
                            columns={columns}
                            {...item}
                            onSelectedChange={this.onSelectedChange}
                          />
                        );
                      })
                    }
                  </TableBody>
                </Table>

                <TablePager
                  totalRecords={totalRecords}
                  isFetching={isFetching}
                  {...otherProps}
                />
              </div>
          }
        </PageContentBody>

        <ConfirmModal
          isOpen={isConfirmRemoveModalOpen}
          kind={kinds.DANGER}
          title={translate('RemoveSelected')}
          message={translate('RemoveSelectedMessageText')}
          confirmLabel={translate('RemoveSelected')}
          onConfirm={this.onRemoveSelectedConfirmed}
          onCancel={this.onConfirmRemoveModalClose}
        />
      </PageContent>
    );
  }
}

Blocklist.propTypes = {
  isAuthorFetching: PropTypes.bool.isRequired,
  isAuthorPopulated: PropTypes.bool.isRequired,
  isFetching: PropTypes.bool.isRequired,
  isPopulated: PropTypes.bool.isRequired,
  error: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  totalRecords: PropTypes.number,
  isRemoving: PropTypes.bool.isRequired,
  isClearingBlocklistExecuting: PropTypes.bool.isRequired,
  onRemoveSelected: PropTypes.func.isRequired,
  onClearBlocklistPress: PropTypes.func.isRequired
};

export default Blocklist;
