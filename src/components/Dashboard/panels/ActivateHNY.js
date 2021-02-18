import React, { useCallback } from 'react'
import { useCourtClock } from '../../../providers/CourtClock'
import HNYForm from './HNYForm'
import { useCourtConfig } from '../../../providers/CourtConfig'
import {
  useHNYTokenAllowance,
  useJurorUniqueUserId,
  useMaxActiveBalance,
} from '../../../hooks/useCourtContracts'
import { useWallet } from '../../../providers/Wallet'
import { bigNum, formatUnits, max, min } from '../../../lib/math-utils'
import { ZERO_ADDRESS } from '../../../lib/web3-utils'

const ActivateHNY = React.memo(function ActivateHNY({
  onActivateHNY,
  activeBalance,
  walletBalance,
  inactiveBalance,
  fromWallet,
  onDone,
}) {
  const { account } = useWallet()
  const { currentTermId } = useCourtClock()

  const maxActiveBalance = useMaxActiveBalance(currentTermId)
  const maxToActivate = max(maxActiveBalance.sub(activeBalance), bigNum(0))

  const maxAmount = min(
    fromWallet ? walletBalance : inactiveBalance,
    maxToActivate
  )

  const { anjToken, minActiveBalance } = useCourtConfig()

  const minActiveBalanceFormatted = formatUnits(minActiveBalance, {
    digits: anjToken.decimals,
  })
  const maxToActivateFormatted = formatUnits(maxToActivate, {
    digits: anjToken.decimals,
    precision: anjToken.decimals,
  })
  const maxAmountFormatted = formatUnits(maxAmount, {
    digits: anjToken.decimals,
    precision: anjToken.decimals,
  })

  const validation = useCallback(
    amountBN => {
      if (amountBN.gt(maxAmount)) {
        if (amountBN.gt(maxToActivate)) {
          return `You cannot activate more than ${maxToActivateFormatted} ${anjToken.symbol}`
        }

        return `Insufficient funds, your ${
          fromWallet
            ? 'wallet balance is'
            : 'inactive balance available for activation is'
        } ${maxAmountFormatted} ${anjToken.symbol} `
      }

      if (activeBalance.add(amountBN).lt(minActiveBalance)) {
        return `You must have at least ${minActiveBalanceFormatted} ${anjToken.symbol} activated`
      }

      return null
    },
    [
      activeBalance,
      anjToken.symbol,
      fromWallet,
      maxAmount,
      maxAmountFormatted,
      maxToActivate,
      maxToActivateFormatted,
      minActiveBalance,
      minActiveBalanceFormatted,
    ]
  )

  const [allowance] = useHNYTokenAllowance(account)
  const uniqueUserID = useJurorUniqueUserId(account)
  const hasUniqueUserId = uniqueUserID && uniqueUserID !== ZERO_ADDRESS

  const handleActivateHNY = useCallback(
    amount => {
      onActivateHNY(account, amount, hasUniqueUserId, allowance)
    },
    [account, allowance, hasUniqueUserId, onActivateHNY]
  )

  return (
    <HNYForm
      actionLabel="Activate"
      maxAmount={maxAmount}
      onSubmit={handleActivateHNY}
      onDone={onDone}
      runParentValidation={validation}
    />
  )
})

export default ActivateHNY