////////////////////////////////////////////////////////////////////////////////
/// DISCLAIMER
///
/// Copyright 2018 ArangoDB GmbH, Cologne, Germany
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///
/// Copyright holder is ArangoDB GmbH, Cologne, Germany
///
/// @author Jan Christoph Uhde
////////////////////////////////////////////////////////////////////////////////

#include "ModificationExecutor.h"
#include "Aql/AqlValue.h"
#include "Aql/OutputAqlItemRow.h"
#include "Basics/Common.h"

#include <algorithm>

using namespace arangodb;
using namespace arangodb::aql;

// Missing functionality
//
// RegisterId ReturnBlock::returnInheritedResults() {
//   _returnInheritedResults = true;
//
//   auto ep = ExecutionNode::castTo<ReturnNode const*>(getPlanNode());
//   auto it = ep->getRegisterPlan()->varInfo.find(ep->_inVariable->id);
//   TRI_ASSERT(it != ep->getRegisterPlan()->varInfo.end());
//
//   return it->second.registerId;
// }

ModificationExecutorInfos::ModificationExecutorInfos(RegisterId inputRegister, RegisterId outputRegister,
                                         RegisterId nrInputRegisters, RegisterId nrOutputRegisters,
                                         std::unordered_set<RegisterId> registersToClear,
                                         bool doCount, bool returnInheritedResults)
    : ExecutorInfos(make_shared_unordered_set({inputRegister}),
                    make_shared_unordered_set({outputRegister}), nrInputRegisters,
                    nrOutputRegisters, std::unordered_set<RegisterId>{} /*to clear*/,  // std::move(registersToClear) // use this once register planning is fixed
                    std::unordered_set<RegisterId>{} /*to keep*/
                    ),
      _inputRegisterId(inputRegister),
      _outputRegisterId(outputRegister),
      _doCount(doCount),
      _returnInheritedResults(returnInheritedResults) {}

ModificationExecutor::ModificationExecutor(Fetcher& fetcher, ModificationExecutorInfos& infos)
    : _infos(infos), _fetcher(fetcher){};
ModificationExecutor::~ModificationExecutor() = default;

std::pair<ExecutionState, ModificationExecutor::Stats> ModificationExecutor::produceRow(OutputAqlItemRow& output) {
  ExecutionState state;
  ModificationExecutor::Stats stats;
  InputAqlItemRow inputRow = InputAqlItemRow{CreateInvalidInputRowHint{}};
  std::tie(state, inputRow) = _fetcher.fetchRow();

  if (state == ExecutionState::WAITING) {
    TRI_ASSERT(!inputRow);
    return {state, std::move(stats)};
  }

  if (!inputRow) {
    TRI_ASSERT(state == ExecutionState::DONE);
    return {state, std::move(stats)};
  }

  if (_infos._returnInheritedResults) {
    output.copyRow(inputRow);
  } else {
    AqlValue const& val = inputRow.getValue(_infos._inputRegisterId);
    TRI_IF_FAILURE("ReturnBlock::getSome") {
      THROW_ARANGO_EXCEPTION(TRI_ERROR_DEBUG);
    }
    output.setValue(_infos._outputRegisterId, inputRow, val);
  }

  if (_infos._doCount) {
    stats.incrCounted();
  }
  return {state, std::move(stats)};
}
